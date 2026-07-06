import { apiClient } from '../../api/client';
import { API_ENDPOINTS } from '../../api/endpoints';
import type {
  AdminUser,
  AutologinResponse,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  RefreshRequest,
  RefreshResponse,
} from './types';

// Dev-only guard against the UNCONFIRMED response shapes in ./types.ts — warns
// with the exact field(s) missing instead of letting a real login silently
// produce `undefined` deep in the UI. Safe to delete once shapes are confirmed.
function warnIfShapeMismatch(label: string, data: unknown, requiredFields: string[]): void {
  if (!import.meta.env.DEV) return;
  const missing = requiredFields.filter((field) => !data || typeof data !== 'object' || !(field in data));
  if (missing.length > 0) {
    console.warn(
      `[auth] ${label} response is missing expected field(s): ${missing.join(', ')}. ` +
        `The response shape in src/features/auth/types.ts is UNCONFIRMED (placeholder). ` +
        `Update that file and this file's warnIfShapeMismatch call once you have a real payload. ` +
        `See API_INTEGRATION.md → "Known Gaps". Actual response:`,
      data,
    );
  }
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>(API_ENDPOINTS.admin.auth.login, payload);
  warnIfShapeMismatch('login', data, ['access_token', 'refresh_token', 'admin']);
  return data;
}

export async function refreshToken(payload: RefreshRequest): Promise<RefreshResponse> {
  const { data } = await apiClient.post<RefreshResponse>(API_ENDPOINTS.admin.auth.refresh, payload);
  warnIfShapeMismatch('refresh', data, ['access_token', 'refresh_token']);
  return data;
}

export async function logout(payload: LogoutRequest): Promise<void> {
  await apiClient.post(API_ENDPOINTS.admin.auth.logout, payload);
}

export async function autologin(): Promise<AutologinResponse> {
  const { data } = await apiClient.get<AdminUser>(API_ENDPOINTS.admin.auth.autologin);
  warnIfShapeMismatch('autologin', data, ['id', 'email']);
  return data;
}
