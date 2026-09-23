// Request shapes are certain — they mirror the DTOs documented in the live
// OpenAPI spec (https://misra-test.mvp-apps.ae/api-json).
// Both /admin/auth/login and /host/auth/login accept either an email or a
// phoneNumber alongside the password — send exactly one of them.
export type LoginRequest =
  | { email: string; password: string }
  | { phoneNumber: string; password: string };

export interface RefreshRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

// ---------------------------------------------------------------------------
// CONFIRMED for login and autologin (captured from real responses); refresh's
// shape is inferred from these, not independently confirmed. `api.ts`
// runtime-checks responses against this shape and throws loudly on mismatch.
// See API_INTEGRATION.md → "Known Gaps".
// ---------------------------------------------------------------------------

// Real role model is DB-driven (see GET/POST /admin/roles) — not the old
// hardcoded 'admin' | 'manager' union in ../../types.ts. Kept minimal here
// until the Roles API is integrated; App.tsx adapts this into the legacy
// `User` shape as a temporary bridge. No `name` field — the API doesn't
// return one, so displaying a name must derive it from `email`.
export interface AdminUser {
  id: string;
  email: string;
  userType: string;
  // Seen on a real payload but not required — optional so a missing/renamed
  // field here never breaks login. Not currently used anywhere in the UI.
  userMode?: string;
  notificationSettings?: {
    bookingUpdates?: boolean;
    stayReminders?: boolean;
    promotions?: boolean;
  };
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: AdminUser;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

// CONFIRMED live: autologin is NOT just an AdminUser — it returns the same
// token-pair-plus-user shape as login/refresh, and mints a genuinely new
// access_token/refresh_token pair on every call (not an echo of the input).
// AuthContext's bootstrap must persist these, not just read `.user` — the
// refresh token used to reach this call is superseded the moment this
// response comes back, so skipping the persist here would silently break the
// *next* reload's /refresh call the same way the earlier race bug did.
export interface AutologinResponse {
  access_token: string;
  refresh_token: string;
  user: AdminUser;
}
