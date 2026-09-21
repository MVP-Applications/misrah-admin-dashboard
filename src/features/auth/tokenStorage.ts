import type { UserRole } from '../../types';

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

// Which portal (Admin HQ vs Host Hub) the persisted refresh token belongs to
// — persisted (not just kept in AuthContext's React state) for two reasons:
// 1. api/client.ts's refresh logic is a plain module with no access to React
//    state, and now needs to know which portal it's refreshing for (Admin HQ
//    uses POST /admin/auth/refresh, Host Hub uses POST /host/auth/refresh).
// 2. AuthContext's bootstrap effect needs it to restore the right portal UI
//    after a reload — without this, a reloaded Host Hub session would
//    silently render the Admin HQ shell (portalRole defaults to 'admin').
const PORTAL_KEY = 'misrah_admin_portal';

export function getPortal(): UserRole {
  return localStorage.getItem(PORTAL_KEY) === 'manager' ? 'manager' : 'admin';
}

export function setPortal(role: UserRole): void {
  localStorage.setItem(PORTAL_KEY, role);
}

export function clearPortal(): void {
  localStorage.removeItem(PORTAL_KEY);
}

export function clearAll(): void {
  clearAccessToken();
  clearRefreshToken();
  clearPortal();
}
