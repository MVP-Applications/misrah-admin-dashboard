// Request shapes are certain — they mirror the DTOs documented in the live
// OpenAPI spec (https://misra-test.mvp-apps.ae/api-json).
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

// ---------------------------------------------------------------------------
// UNCONFIRMED — the OpenAPI spec documents no response schema for login,
// refresh, or autologin. These shapes are a best-effort placeholder based on
// the request DTOs' naming convention (snake_case token fields) and the
// CreateAdminUserDto fields. `api.ts` runtime-checks responses against this
// shape in dev mode and warns loudly on mismatch.
//
// Once you have a real response body (Postman capture or from the backend
// team), update this file to match, then remove this comment block.
// See API_INTEGRATION.md → "Known Gaps" for the full checklist.
// ---------------------------------------------------------------------------

// Real role model is DB-driven (see GET/POST /admin/roles) — not the old
// hardcoded 'admin' | 'manager' union in ../../types.ts. Kept minimal here
// until the Roles API is integrated; App.tsx adapts this into the legacy
// `User` shape as a temporary bridge.
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  roleIds?: string[];
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  admin: AdminUser;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

export type AutologinResponse = AdminUser;
