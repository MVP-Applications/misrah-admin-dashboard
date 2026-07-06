// Access token: memory-only. Lost on page reload by design — AuthContext's
// bootstrap flow re-derives it via refreshToken() on mount. This keeps the
// short-lived access token out of any persistent, script-readable storage.
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

// Refresh token: persisted so a session survives a page reload/browser restart.
// The backend does not set any cookies (confirmed live) — it expects the client
// to hold and resend refresh_token explicitly, so localStorage is the only
// option here short of a backend-for-frontend.
const REFRESH_TOKEN_KEY = 'misrah_admin_refresh_token';

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function clearAll(): void {
  clearAccessToken();
  clearRefreshToken();
}
