import { apiClient } from '../../api/client';
import { assertResponseShape } from '../../api/assertShape';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type { UserRole } from '../../types';
import type { AutologinResponse, LoginRequest, LoginResponse, LogoutRequest } from './types';

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
