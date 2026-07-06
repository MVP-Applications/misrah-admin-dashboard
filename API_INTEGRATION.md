# API Integration Guide

Read this before touching anything under `src/api/`, `src/config/`, or `src/features/*`.
It exists so every future API integration (bookings, properties, reviews, etc.) follows
the same shape as auth instead of reinventing it — read it before adding a new endpoint,
not just when something breaks.

## Stack

- **React 19** + **react-router-dom 7** (client-side routing, no SSR)
- **Vite 6** (build tool, `import.meta.env.VITE_*` for config)
- **axios** — single shared instance in `src/api/client.ts`
- **Tailwind 4** (styling, unrelated to this doc)
- No data-fetching/cache library (React Query, SWR, etc.) yet. See "Future: data fetching
  beyond auth" below before adding one ad-hoc.

Backend: NestJS, OpenAPI docs at `https://misra-test.mvp-apps.ae/api#/` (spec JSON at
`/api-json`). **Note the base URL has no `/api` prefix** — `/api` is only where the docs
UI is hosted; real endpoints are at the root (e.g. `https://misra-test.mvp-apps.ae/admin/auth/login`).

## Folder structure

```
src/
  config/
    env.ts              — the ONLY place that reads import.meta.env
  api/
    client.ts            — the ONE axios instance (interceptors: x-api-key, Bearer, 401 refresh)
    endpoints.ts          — every backend path, grouped by domain
    types.ts              — shared API-wide types (error envelope, etc.)
  features/
    auth/
      types.ts            — request/response types for this feature
      api.ts               — plain functions calling apiClient (no React)
      tokenStorage.ts       — token persistence (auth-specific)
      AuthContext.tsx        — React state/hook wrapping api.ts for consumption by components
```

## The rules

1. **Endpoint paths live only in `src/api/endpoints.ts`.** Never write a path string
   (`'/admin/...'`) anywhere else. Add new paths there first, nested by domain the same
   way `admin.auth.*` is.
2. **Components never import `apiClient` directly.** They call a feature's `api.ts`
   function, usually through a hook/context (see `useAuth()`). This is what makes it
   possible to change how a request is made (add caching, retry, optimistic updates)
   without touching every component that triggers it.
3. **One axios instance.** Don't `axios.create()` again elsewhere — import `apiClient`
   from `src/api/client.ts`. It already attaches `x-api-key` and `Authorization` and
   handles 401 → refresh → retry.
4. **Env vars are read once**, in `src/config/env.ts`, exported as the `env` object.
   Don't call `import.meta.env.VITE_*` anywhere else — this is what keeps adding a new
   environment (see below) a one-file change.

## Adding a new feature's API integration

Mirror the `auth` feature:

1. Add the path(s) to `src/api/endpoints.ts` under a new domain key.
2. Create `src/features/<name>/types.ts` — request/response types. If the response
   shape isn't documented anywhere (common with this backend — see "Known Gaps"),
   mark it `UNCONFIRMED` in a comment and add a dev-mode shape check (copy the pattern
   in `src/features/auth/api.ts`'s `warnIfShapeMismatch`).
3. Create `src/features/<name>/api.ts` — plain async functions using `apiClient` +
   `API_ENDPOINTS`. No React here.
4. If the feature needs shared state across components (like the logged-in user),
   wrap it in a Context the way `AuthContext.tsx` does. If it's just "fetch data for
   this screen," a local `useState`/`useEffect` in the view (or see "Future" below) is
   fine — don't build a global context for everything.

## Auth: how it actually works

- **Every request** requires an `x-api-key` header — confirmed live against the test
  server (`{"message":"API Key is missing"}` without it). `apiClient`'s request
  interceptor sets it on every call from `env.API_KEY`. This key is **not treated as a
  secret** — the API docs describe it as identifying the calling platform
  (Web/Android/iOS), and a client-side SPA can't hide it anyway. If that assumption
  turns out to be wrong, this needs a backend-for-frontend proxy instead — flag it.
- **Token storage**: access token is kept in memory only (`tokenStorage.ts`, module
  variable) — lost on page reload by design. Refresh token is persisted in
  `localStorage` (key `misrah_admin_refresh_token`), because the backend sets no
  cookies — it expects the client to hold and resend `refresh_token` explicitly (that's
  why `/refresh` and `/logout` both take it in the request body).
- **On app load** (`AuthContext`'s bootstrap effect): if a refresh token is stored, call
  `POST /admin/auth/refresh` to mint a new access token, then `GET /admin/auth/autologin`
  to fetch the current admin profile. This is what lets a page reload keep the session
  alive instead of always bouncing to `/login`.
- **On a 401 mid-session** (`api/client.ts` response interceptor): pause the failed
  request, run a single deduped refresh (concurrent 401s share one refresh call, not
  one each), retry the original request with the new token. If the refresh itself
  fails, clear tokens and call the `onSessionExpired` callback that `AuthContext`
  registers, which forces the app back to `unauthenticated`.
- **Logout**: best-effort `POST /admin/auth/logout` with the refresh token (revokes it
  server-side), then always clears local tokens/state regardless of whether that call
  succeeded — a flaky network shouldn't leave someone stuck "logged in" locally with a
  token the server already can't verify, or unable to log out locally at all.
- Refresh logic is intentionally duplicated once: `api/client.ts` has its own inline
  refresh call (bypassing `apiClient`'s interceptors, using plain `axios.post`) instead
  of importing `features/auth/api.ts`, to avoid a circular import between the generic
  `api/` layer and the `auth` feature. If you touch the refresh request shape, update
  both call sites (`api/client.ts` and `features/auth/api.ts`).

## Error handling

Confirmed live: any error response comes back as
```json
{ "success": false, "statusCode": 401, "timestamp": "...", "path": "...", "method": "...", "message": "API Key is missing", "error": "Unauthorized" }
```
(`message` is an array of strings instead on validation errors — standard class-validator
behavior.) `api/client.ts` normalizes every rejection — network error, this envelope, or
anything else — into a flat `ApiError { statusCode, message, error? }` (see
`src/api/types.ts`). **Feature `api.ts` files and components can assume any thrown/rejected
value from `apiClient` is already this shape** — don't re-parse `error.response.data`
anywhere else.

## Env vars

| Var | Purpose | Where read |
|---|---|---|
| `VITE_API_BASE_URL` | Backend base URL | `src/config/env.ts` |
| `VITE_API_KEY` | `x-api-key` header value (not secret, see above) | `src/config/env.ts` |

## Known Gaps / TODO

- **Response shapes for `/admin/auth/login`, `/refresh`, `/autologin` are UNCONFIRMED.**
  The OpenAPI spec documents no response schema for any of them. Current placeholder
  (in `src/features/auth/types.ts`): `{ access_token, refresh_token, admin: AdminUser }`
  for login/refresh-adjacent fields, `AdminUser` directly for autologin. `api.ts` warns
  in the dev console if a real response doesn't match. **Once you have a real payload:
  update `src/features/auth/types.ts` and the `warnIfShapeMismatch` field lists in
  `src/features/auth/api.ts`, and the inline destructuring in `api/client.ts`'s
  `refreshAccessToken`.**
- **Forgot/reset password is not implemented.** Paths are registered in
  `api/endpoints.ts` (`forgotPassword`, `resetPassword`) and DTOs exist
  (`ForgotPasswordDto { email }`, `ResetPasswordDto { token, newPassword }`) but nothing
  calls them. The login screen shows a "coming soon" note instead of a real flow.
- **Role model is a placeholder.** The backend has a real DB-driven roles system
  (`GET/POST/PATCH/DELETE /admin/roles`, `roleIds` on admin users), but every existing
  view in this app still expects the legacy `'admin' | 'manager'` union from
  `src/types.ts`. `App.tsx`'s `toLegacyUser()` currently hardcodes `role: 'admin'` for
  everyone who logs in. **This is not real authorization** — it only affects which
  sidebar renders. Don't build permission checks on top of it; real authorization has to
  happen server-side (expect and handle 403s) until the Roles API is wired in.
- **Single environment only.** `VITE_API_BASE_URL` points at `misra-test` only. To add
  staging/production: introduce a `VITE_APP_ENV` var and branch on it inside
  `src/config/env.ts` — that's the only file that should need to change.
- **`x-api-key` sensitivity is an assumption, not a confirmation.** Proceeding on the
  read that it's a platform identifier, not a secret, based on the OpenAPI description
  text. If the backend team says otherwise, this needs a proxy/BFF — don't just leave it
  in the client bundle.

## Future: data fetching beyond auth

Auth uses plain `useState`/`useEffect` in a Context because it's global session state
with imperative actions (login/logout), not a typical "fetch and cache" concern. For
future screens that fetch lists/details from the API (bookings, properties, reviews —
currently all hardcoded mock data in `src/constants.ts`), consider introducing a proper
data-fetching library (e.g. TanStack Query) on top of the same `apiClient` rather than
hand-rolling loading/error/refetch state per view — but that's a deliberate addition to
discuss, not something to bring in silently as a side effect of one feature.
