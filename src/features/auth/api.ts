import { apiClient } from '../../api/client';
import { assertResponseShape } from '../../api/assertShape';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type { UserRole } from '../../types';
import type { AutologinResponse, HostOtpSendRequest, LoginRequest, LoginResponse, LogoutRequest } from './types';

// Confirmed live: every success response is wrapped in { success, message,
// data, timestamp, responseTime } — unwrap .data before validating the inner
// shape. Both login's and autologin's inner shapes are confirmed.
//
// No refreshToken() here on purpose — the one canonical refresh implementation
// lives in api/client.ts's getRefreshedAccessToken(), shared by both the
// 401-retry interceptor and AuthContext's bootstrap. A second, non-deduped
// implementation here is exactly what caused the "refresh the page and I'm
// logged out" bug (two concurrent refreshes racing against a single-use
// rotating token) — don't reintroduce it. See API_INTEGRATION.md.

// Admin HQ and Host Hub do NOT share a login endpoint (see
// API_ENDPOINTS.host.auth vs .admin.auth) — role picks which one, mirroring
// how api/client.ts's refresh logic picks between admin/host refresh.
export async function login(payload: LoginRequest, role: UserRole = 'admin'): Promise<LoginResponse> {
  const url = role === 'manager' ? API_ENDPOINTS.host.auth.login : API_ENDPOINTS.admin.auth.login;
  const { data } = await apiClient.post<ApiSuccessEnvelope<LoginResponse>>(url, payload);
  return assertResponseShape('login', data.data, ['access_token', 'refresh_token', 'user']);
}

export async function logout(payload: LogoutRequest): Promise<void> {
  await apiClient.post(API_ENDPOINTS.admin.auth.logout, payload);
}

// GET /auth/autologin — shared by both portals (see API_ENDPOINTS.auth),
// unlike login/refresh which are split under admin.auth/host.auth.
export async function autologin(): Promise<AutologinResponse> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<AutologinResponse>>(API_ENDPOINTS.auth.autologin);
  return assertResponseShape('autologin', data.data, ['access_token', 'refresh_token', 'user']);
}

// POST /host/auth/otp/send — confirmed live, returns 201. Host Hub only; the
// response body isn't relied on (shape unconfirmed), success is the 2xx.
export async function sendHostLoginOtp(payload: HostOtpSendRequest): Promise<void> {
  await apiClient.post(API_ENDPOINTS.host.auth.otpSend, payload);
}

// Password reset via recovery code (host → /host/auth/*, admin → /admin/auth/*):
//   1. POST …/forgot-password { email | phoneNumber }        → sends a code (call again to resend)
//   2. POST …/verify-otp      { email | phoneNumber, otp }   → returns a reset token
//   3. POST …/reset-password  { token, newPassword }
const authRoutes = (role: UserRole) => (role === 'manager' ? API_ENDPOINTS.host.auth : API_ENDPOINTS.admin.auth);

// "name@x.com" → { email }, anything else → { phoneNumber } (spaces/dashes stripped).
export function recoveryIdentifier(value: string): { email: string } | { phoneNumber: string } {
  const v = value.trim();
  return v.includes('@') ? { email: v } : { phoneNumber: v.replace(/[\s\-().]/g, '') };
}

export async function requestPasswordReset(emailOrPhone: string, role: UserRole): Promise<void> {
  await apiClient.post(authRoutes(role).forgotPassword, recoveryIdentifier(emailOrPhone));
}

// Returns the reset token for step 3. The response shape isn't documented,
// so the token is read from the common field names.
export async function verifyPasswordResetOtp(emailOrPhone: string, otp: string, role: UserRole): Promise<string> {
  const { data } = await apiClient.post<ApiSuccessEnvelope<unknown>>(authRoutes(role).verifyOtp, {
    ...recoveryIdentifier(emailOrPhone),
    otp: otp.trim(),
  });
  const body = (data?.data ?? data) as Record<string, unknown> | string | null;
  const token =
    typeof body === 'string'
      ? body
      : body && (body.token ?? body.resetToken ?? body.reset_token ?? body.passwordResetToken ?? body.access_token);
  if (typeof token !== 'string' || !token) {
    console.error('[auth] verify-otp response had no reset token:', data);
    throw new Error('Code verified, but no reset token was returned. Please try again.');
  }
  return token;
}

export async function resetPassword(token: string, newPassword: string, role: UserRole): Promise<void> {
  await apiClient.post(authRoutes(role).resetPassword, { token, newPassword });
}
