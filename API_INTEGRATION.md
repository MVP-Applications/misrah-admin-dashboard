# API Integration Guide

Read this before touching anything under `src/api/`, `src/config/`, or `src/features/*`.
It exists so every future API integration follows the same shape as auth/bookings
instead of reinventing it — read it before adding a new endpoint, not just when
something breaks.

## Stack

- **React 19** + **react-router-dom 7** (client-side routing, no SSR)
- **Vite 6** (build tool, `import.meta.env.VITE_*` for config)
- **axios** — single shared instance in `src/api/client.ts`
- **Tailwind 4** (styling, unrelated to this doc)
- No data-fetching/cache library (React Query, SWR, etc.) yet. See "Future: data fetching
  beyond auth" below before adding one ad-hoc.

Backend: NestJS (**source available** at `../misra-api-nest`, a sibling of this repo —
when a Swagger example looks wrong or underspecified, read the actual controller/service
there instead of guessing; it has repeatedly disagreed with the hand-written `@ApiResponse`
examples in the deployed docs). OpenAPI docs at `https://misra-test.mvp-apps.ae/api#/` (spec
JSON at `/api-json`). **Note the base URL has no `/api` prefix** — `/api` is only where the
docs UI is hosted; real endpoints are at the root (e.g.
`https://misra-test.mvp-apps.ae/admin/auth/login`). The deployed spec has been updated more
than once during this project's life — re-fetch `/api-json` rather than trusting a stale
local copy if something that "isn't documented" might plausibly have been added since.

## Folder structure

```
src/
  config/
    env.ts              — the ONLY place that reads import.meta.env
  api/
    client.ts            — the ONE axios instance (interceptors: x-api-key, Bearer, 401 refresh)
    endpoints.ts          — every backend path, grouped by domain
    types.ts              — shared API-wide types (error envelope, success envelope, etc.)
    assertShape.ts         — shared runtime response-shape check, used by every feature's api.ts
  features/
    auth/
      types.ts            — request/response types for this feature
      api.ts               — plain functions calling apiClient (no React)
      tokenStorage.ts       — token persistence (auth-specific)
      AuthContext.tsx        — React state/hook wrapping api.ts for consumption by components
    bookings/
      types.ts            — request/response types (list only, for now)
      api.ts               — plain functions calling apiClient (no React)
```

## The rules

1. **Endpoint paths live only in `src/api/endpoints.ts`.** Never write a path string
   (`'/admin/...'`) anywhere else. Add new paths there first, nested by domain the same
   way `admin.auth.*` is.
2. **Components never import `apiClient` directly.** They call a feature's `api.ts`
   function, usually through a hook/context (see `useAuth()`), or a local
   `useState`/`useEffect` for a screen-level fetch (see `BookingsView.tsx`). This is what
   makes it possible to change how a request is made (add caching, retry, optimistic
   updates) without touching every component that triggers it.
3. **One axios instance.** Don't `axios.create()` again elsewhere — import `apiClient`
   from `src/api/client.ts`. It already attaches `x-api-key` and `Authorization` and
   handles 401 → refresh → retry.
4. **Env vars are read once**, in `src/config/env.ts`, exported as the `env` object.
   Don't call `import.meta.env.VITE_*` anywhere else — this is what keeps adding a new
   environment (see below) a one-file change.

## Adding a new feature's API integration

Mirror the `auth`/`bookings` features:

1. **Check the backend source first** (`../misra-api-nest`), not just the Swagger doc —
   read the controller for the exact route/guards/permissions, and the service method for
   the exact response shape. The Swagger `@ApiResponse` examples in this codebase have
   repeatedly turned out to not match the real DTOs (see "Known Gaps" for two concrete
   examples). Source beats docs; a live captured response beats both.
2. Add the path(s) to `src/api/endpoints.ts` under a new domain key.
3. Create `src/features/<name>/types.ts` — request/response types. If you couldn't verify
   the shape against source AND a live response, mark it `UNCONFIRMED` in a comment and
   validate it at runtime with `assertResponseShape` from `src/api/assertShape.ts` (shared
   by every feature). It **throws** on mismatch, logging the real response first — it used
   to only `console.warn` in an earlier version, which let a real login proceed with a
   `null` user and sent the app into an infinite redirect loop. Never go back to just
   warning. Only assert fields you can't render without; fields that are "nice to have"
   for display can stay optional in the type and be rendered with a fallback instead —
   don't make the whole page unusable over a missing avatar URL.
4. Create `src/features/<name>/api.ts` — plain async functions using `apiClient` +
   `API_ENDPOINTS`. No React here.
5. If the feature needs shared state across components (like the logged-in user), wrap it
   in a Context the way `AuthContext.tsx` does. If it's just "fetch data for this screen,"
   a local `useState`/`useEffect` in the view (see `BookingsView.tsx`) is fine — don't
   build a global context for everything.

## Auth: how it actually works

- **Every request** requires an `x-api-key` header — confirmed live against the test
  server (`{"message":"API Key is missing"}` without it; confirmed in backend source too,
  `ApiKeyGuard` in `misra-api-nest/src/modules/api-key/guards/api-key.guard.ts`).
  `apiClient`'s request interceptor sets it on every call from `env.API_KEY`. This key is
  **not treated as a secret** — the API docs describe it as identifying the calling
  platform (Web/Android/iOS), and a client-side SPA can't hide it anyway.
- **That same guard also enforces an origin allowlist** per API key
  (`keyDoc.authorizedOrigins`) when the key's platform is `'web'` — a request with no
  matching `Origin`/`Referer` header gets `401 "Request origin is not authorized"`. A
  browser sends this automatically; a bare `curl`/`node fetch` test script won't unless
  you set it explicitly. Don't mistake this for a broken key or endpoint when testing
  manually outside the browser.
- **Token storage**: access token is kept in memory only (`tokenStorage.ts`, module
  variable) — lost on page reload by design. Refresh token is persisted in
  `localStorage` (key `misrah_admin_refresh_token`), because the backend sets no
  cookies — it expects the client to hold and resend `refresh_token` explicitly (that's
  why `/refresh` and `/logout` both take it in the request body).
- **On app load** (`AuthContext`'s bootstrap effect): if a refresh token is stored, call
  the shared refresh (below) to mint a new access token, then `GET /admin/auth/autologin`
  to fetch the current admin profile — persisting the tokens *that call* returns too (see
  next bullet). This is what lets a page reload keep the session alive instead of always
  bouncing to `/login`.
- **`/admin/auth/autologin` is not just a profile fetch — it mints a brand-new token pair
  on every call**, confirmed live (different JWTs than the `/refresh` call immediately
  before it in the same bootstrap). Its response shape is the same as login's:
  `{ access_token, refresh_token, user }`. `AuthContext`'s bootstrap persists these tokens
  explicitly — skipping that silently breaks the *next* reload's `/refresh` call, because
  the refresh token used to reach `autologin()` is already superseded by the time it
  returns. If you ever add another caller of `autologin()`, it must persist its tokens
  too.
- **There is exactly ONE refresh implementation**: `getRefreshedAccessToken()` in
  `api/client.ts` (bypasses `apiClient`'s own interceptors via a plain `axios.post`, so it
  can never trigger the 401-retry logic on itself, and dedupes concurrent callers into a
  single in-flight request via a shared promise). Both the 401-retry interceptor and
  `AuthContext`'s bootstrap effect call this same function — **never add a second,
  independent refresh call anywhere** (`features/auth/api.ts` deliberately has no
  `refreshToken()` export).
- **Real bug this dedup fixes, and why**: React StrictMode (`main.tsx`) double-invokes
  effects on mount in dev. An earlier version of `AuthContext`'s bootstrap effect called
  refresh independently of the interceptor, so every page load fired two concurrent
  refreshes with the same single-use, rotating refresh token — the second always got
  rejected, landed in the `catch`, and called `tokenStorage.clearAll()`, wiping out the
  valid session the first call had just established. Symptom: **refreshing the page
  always logged you out.** Fixed by (1) routing bootstrap through the shared dedup, and
  (2) a `hasBootstrapped` ref guard so the effect body only ever runs once regardless of
  StrictMode. **Do not add an `isMounted`-guarded cleanup to that effect** — StrictMode
  runs the synthetic cleanup synchronously, well before the real bootstrap promise
  resolves, which would flip `isMounted` false and silently swallow the eventual
  `setStatus`/`setUser` calls (the app would sit on the loading spinner forever).
  `AuthProvider` wraps the whole app and is never genuinely unmounted while it's running,
  so there's no real set-state-after-unmount risk to guard against here. If a similar
  "works once, breaks on refresh/remount" bug shows up elsewhere, check for this exact
  pattern first.
- **On a 401 mid-session** (`api/client.ts` response interceptor): pause the failed
  request, run the shared deduped refresh, retry the original request with the new
  token. If the refresh itself fails, clear tokens and call the `onSessionExpired`
  callback that `AuthContext` registers, which forces the app back to `unauthenticated`.
- **Logout**: best-effort `POST /admin/auth/logout` with the refresh token (revokes it
  server-side), then always clears local tokens/state regardless of whether that call
  succeeded — a flaky network shouldn't leave someone stuck "logged in" locally with a
  token the server already can't verify, or unable to log out locally at all.

## Bookings: how it actually works

- `BookingsView.tsx` wires up the list, detail view, and cancel against real endpoints.
  **Reschedule ("Manage") required a backend change — see below.** Message is a
  deliberate stub (a real Chat module exists in the backend but wiring it up is a
  separate, much larger task). Call is a real `tel:` link using whatever phone number
  the detail response has — no backend change needed for that one.
- **Detail view**: `GET /admin/bookings/{id}` (`getBookingById` in
  `features/bookings/api.ts`) returns a richer shape than the list — confirmed from
  `getBookingByIdForAdmin()`'s Mongo aggregation in the backend source, this is the ONE
  booking endpoint that actually resolves `propertySnapshot.city`, resolves
  `propertySnapshot.images` to `{_id, fullUrl}` objects, and resolves
  `traveler`/`owner.profileImage` to a real fullUrl string. That's why the detail view can
  show a real guest photo and the list can't.
- **Cancel**: `PATCH /admin/bookings/{id}/cancel` (`cancelBooking`), body
  `{ reason?: string }` — confirmed to already exist and require no backend change.
- **Reschedule ("Manage") required adding a new backend endpoint.** The only reschedule
  endpoint that existed, `PATCH /booking/{id}/reschedule`, explicitly throws
  `ForbiddenException('Not authorized to reschedule')` unless the caller is the exact
  traveler or host on that specific booking (checked in `booking.service.ts`) — an admin
  acting on someone else's booking always got a 403. We added
  `PATCH /admin/bookings/{id}/reschedule` to `AdminBookingController`
  (`misra-api-nest/src/modules/booking/admin-booking.controller.ts`), backed by a new
  `rescheduleForAdmin()` service method that's a thin wrapper: the existing `reschedule()`
  method gained an additive `options?: { skipOwnershipCheck?: boolean }` parameter
  (default behavior unchanged for existing traveler/host callers) instead of duplicating
  ~150 lines of pricing/currency/availability logic. Verified with `tsc --noEmit` in the
  backend repo — zero errors introduced (pre-existing, unrelated errors in
  `booking-receipt.service.ts` and `test/chat.e2e-spec.ts` are not from this change).
  **This backend change is not deployed to `misra-test` yet** — it only exists in the
  local `misra-api-nest` checkout. `PATCH /admin/bookings/{id}/reschedule` will 404 from
  the frontend until someone builds and deploys that backend. The reschedule calendar in
  `BookingsView.tsx` is real (actual month grid, click-to-select check-in/check-out range,
  guest counts pulled from the real booking) and will work as soon as that deploy happens.
- **Two real list endpoints exist**: `/booking/host` (host-scoped, "bookings for the logged-in
  host") and `/admin/bookings` (platform-wide, requires `Permission.ADMIN_READ`, backed by
  a dedicated `AdminBookingController` in the backend source). This app calls
  `/admin/bookings` because every logged-in user is currently treated as an admin (see
  "Role model is a placeholder" below) — there's no real host-only account flow yet to
  point at `/booking/host` instead. `API_ENDPOINTS.bookings.hostAll` is registered for
  when that's built.
- **The Swagger doc's response example for these endpoints is confirmed wrong.** It shows
  `{ page, total, totalPages, data }`. The actual class both endpoints return
  (`PaginatedDataDto` in `misra-api-nest/src/common/dto/response-dto/paginated-dto.ts`)
  has fields `currentPage`, `totalCount`, `totalPages`, `data` — verified by reading the
  class and the service methods that construct it, not yet independently verified via a
  captured live response. `assertResponseShape` will say so immediately if this is wrong.
- **Guest/host objects have no avatar.** Confirmed from the repository populate calls
  (`.select('name email phoneNumber')`, no `profileImage`) — `toLegacyBooking()` in
  `BookingsView.tsx` uses a generated placeholder avatar instead of a real one.
- **Property image/city are not usable from this endpoint.** `propertySnapshot.images` is
  an array of raw file-ID strings (copied at booking-creation time from the property's
  own `images` field, never resolved to URLs for host/admin list queries), and
  `propertySnapshot.city` is never populated for these two endpoints — only for the
  traveler-facing `getMyBookings`/`getById`. Not currently a problem: this UI's table
  doesn't render a property photo or city for bookings. If it ever needs to, that's a
  separate files/city-lookup integration, not a booking one.
- **Status is derived client-side to match backend semantics, not invented.** The raw
  stored `status` is `pending | confirmed | cancelled | completed`, but the backend's own
  query-filter logic (`applyBookingStatusFilter` in `booking.service.ts`) further splits
  `confirmed` into "upcoming" vs "ongoing" using `checkInDate`/`checkOutDate` vs today —
  that's exactly what "Confirmed" vs "Hosting" means in this UI's badges.
  `deriveDisplayStatus()` in `BookingsView.tsx` mirrors that same logic instead of
  inventing a new one. `'Pending'` was added to the legacy `Booking.status` union in
  `src/types.ts` because it's a real reachable value with no dedicated query-filter
  equivalent server-side. `'Arriving Soon'` is kept in that union only so existing Badge
  styling code doesn't need to change — it's never actually derived from real data, since
  the backend has no such distinction without an arbitrary "N days out" threshold that
  wasn't worth inventing.

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

**Success responses are wrapped too** — confirmed live from a real login call:
```json
{ "success": true, "message": "Success", "data": { /* actual payload */ }, "timestamp": "...", "responseTime": 178 }
```
Confirmed in backend source too (`TransformResponseInterceptor`, applied globally — it
only adds the envelope/timing, it does not rename or restructure whatever the
controller/service returned). Use `ApiSuccessEnvelope<T>` (`src/api/types.ts`) and unwrap
`.data` before validating/using the inner payload — see how `features/auth/api.ts` or
`features/bookings/api.ts` does it.

## Local mock login (dev-only)

Working locally without a real `VITE_API_KEY` is otherwise impossible — the backend
rejects every request without it, including login, so there's no way to reach the real
API at all until you have the real key.

`LoginView` shows an extra "Dev: skip login" button that calls `useAuth().loginWithMock()`
instead of the real `login()`. It fakes an authenticated session with a hardcoded
`AdminUser` entirely in memory — no network call, and it never touches `tokenStorage`,
so it doesn't persist across a reload and can't be mistaken for a real session.

Gating is a **runtime hostname check** (`isLocalhost()` in `src/config/env.ts`, checking
`window.location.hostname === 'localhost' | '127.0.0.1'`), not a build-time env var. This
is deliberate: an env-var flag (e.g. `VITE_MOCK_AUTH=true`) could get copied into a
staging/prod `.env` by mistake and silently ship a login bypass. A hostname check can't —
it only ever evaluates true when the page is actually being served from someone's own
machine. `loginWithMock()` re-checks `isLocalhost()` itself before doing anything, so even
a stray call to it from elsewhere is a no-op off localhost.

Safe to delete once real login is fully verified end-to-end with a real key — but also
harmless to leave, since it can't activate anywhere but localhost.

## Env vars

| Var | Purpose | Where read |
|---|---|---|
| `VITE_API_BASE_URL` | Backend base URL | `src/config/env.ts` |
| `VITE_API_KEY` | `x-api-key` header value (not secret, see above) | `src/config/env.ts` |

## Known Gaps / TODO

- **`/admin/auth/login` and `/admin/auth/autologin`'s inner response shapes are
  CONFIRMED** (both `{ access_token, refresh_token, user: { id, email, userType,
  userMode?, notificationSettings? } }` — note the key is `user`, not `admin`, and there's
  no `name`/`roleIds`). `/admin/auth/refresh`'s shape is inferred from these (same
  token-pair fields), not independently confirmed. `App.tsx`'s `toLegacyUser()` derives a
  display `name` from the email local-part since the API doesn't return one.
- **Bookings pagination field names (`currentPage`/`totalCount`/`totalPages`) are
  source-verified but not live-response-verified** — see "Bookings" above.
- **Admin reschedule needs a backend deploy before it'll work.**
  `PATCH /admin/bookings/{id}/reschedule` was added to the `misra-api-nest` source (not
  yet deployed to `misra-test`) — see "Bookings" above for exactly what changed and why.
  Until deployed, clicking "Manage" → "Save" in the Bookings detail view will fail with a
  404, not a bug in the frontend code.
- **Forgot/reset password is not implemented.** Paths are registered in
  `api/endpoints.ts` (`forgotPassword`, `resetPassword`) and DTOs exist
  (`ForgotPasswordDto { email }`, `ResetPasswordDto { token, newPassword }`) but nothing
  calls them. The login screen shows a "coming soon" note instead of a real flow.
- **Role model is a placeholder.** The backend has a real DB-driven roles system
  (`GET/POST/PATCH/DELETE /admin/roles`, `roleIds` on admin users, plus a `userMode` field
  seen on the logged-in user that looks consumer/host-mode-related, not yet understood
  well enough to build on), but every existing view in this app still expects the legacy
  `'admin' | 'manager'` union from `src/types.ts`. `App.tsx`'s `toLegacyUser()` currently
  hardcodes `role: 'admin'` for everyone who logs in, and `BookingsView`/(previously)
  `HostingModule` call the admin-scoped endpoint unconditionally for the same reason.
  **This is not real authorization** — it only affects which sidebar renders and which
  endpoint gets called. Don't build permission checks on top of it; real authorization has
  to happen server-side (expect and handle 403s) until the Roles API is wired in.
- **Hosting Requests (property moderation) is not currently integrated.** It was at one
  point, using `GET /property/all` + `PATCH /property/{id}/status` (only an `isActive`
  toggle — no real Pending/Approved/Rejected field existed in the API at the time). The
  live Swagger spec has since gained an `admin/property` tag that wasn't there before and
  may resolve that gap — worth re-checking the backend source
  (`../misra-api-nest/src/modules/property`) before rebuilding this, the same way
  `admin/bookings` turned out to already exist despite not being in the first Swagger
  fetch of this project.
- **Single environment only.** `VITE_API_BASE_URL` points at `misra-test` only. To add
  staging/production: introduce a `VITE_APP_ENV` var and branch on it inside
  `src/config/env.ts` — that's the only file that should need to change.
- **`x-api-key` sensitivity is an assumption, not a confirmation.** Proceeding on the
  read that it's a platform identifier, not a secret, based on the OpenAPI description
  text. If the backend team says otherwise, this needs a proxy/BFF — don't just leave it
  in the client bundle.

## Future: data fetching beyond auth

Auth uses plain `useState`/`useEffect` in a Context because it's global session state
with imperative actions (login/logout), not a typical "fetch and cache" concern. Bookings
uses plain `useState`/`useEffect` inside the view itself, since it's just "fetch a page of
data for this screen." For more screens like this (properties, reviews — still hardcoded
mock data in `src/constants.ts`), consider introducing a proper data-fetching library
(e.g. TanStack Query) on top of the same `apiClient` rather than hand-rolling loading/
error/refetch state per view — but that's a deliberate addition to discuss, not something
to bring in silently as a side effect of one feature.
