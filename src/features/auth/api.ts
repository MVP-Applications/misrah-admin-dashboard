import { apiClient } from '../../api/client';
import { assertResponseShape } from '../../api/assertShape';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
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

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiSuccessEnvelope<LoginResponse>>(API_ENDPOINTS.admin.auth.login, payload);
  return assertResponseShape('login', data.data, ['access_token', 'refresh_token', 'user']);
}

export async function logout(payload: LogoutRequest): Promise<void> {
  await apiClient.post(API_ENDPOINTS.admin.auth.logout, payload);
}

export async function autologin(): Promise<AutologinResponse> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<AutologinResponse>>(API_ENDPOINTS.admin.auth.autologin);
  return assertResponseShape('autologin', data.data, ['access_token', 'refresh_token', 'user']);
}
