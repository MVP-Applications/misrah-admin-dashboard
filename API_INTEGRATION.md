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
    properties/
      types.ts            — request/response types
      api.ts               — plain functions calling apiClient (no React)
      mappers.ts            — ApiPropertyListItem <-> legacy Property view-model
    categories/
      types.ts            — request/response types
      api.ts               — plain functions calling apiClient (no React)
    banners/
      types.ts            — request/response types
      api.ts               — plain functions calling apiClient (no React)
    homePageListings/
      types.ts            — request/response types (backs Elite Nodes)
      api.ts               — plain functions calling apiClient (no React)
    adminUsers/
      types.ts            — request/response types (GET /admin/users, PATCH consumer)
      api.ts               — plain functions calling apiClient (no React)
    reviews/
      types.ts            — request/response types (admin moderation)
      api.ts               — plain functions calling apiClient (no React)
    auditLogs/
      types.ts            — request/response types (backs Notifications/Activity Feed)
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

**For the full booking domain — status lifecycle, every endpoint (consumer/host + admin),
pricing/refund logic, and known backend gaps — see
`../misra-api-nest/docs/booking/BOOKING_FLOW.md`.** This section only covers what's
specifically relevant to how the React app integrates with it.

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
  **Confirmed deployed and live on `misra-test`** (verified directly: a valid
  origin/key request to it returns a plain JWT `"Unauthorized"`, not a 404). The
  reschedule calendar in `BookingsView.tsx` is real (actual month grid, click-to-select
  check-in/check-out range, guest counts pulled from the real booking) and works
  end-to-end.
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

## Properties: how it actually works

- Wired up via `src/features/properties/` (`api.ts`/`types.ts`/`mappers.ts`), backing
  `DashboardView` (counts only), `Properties/index.tsx` (Listings browse), `HostingModule.tsx`
  (Hosting Requests moderation queue), `PropertyDetailRoute.tsx`/`PropertyDetailView.tsx`
  (single-property view/edit/delete), and `AddListingModal.tsx` (create). All of it replaced
  what used to be `INITIAL_PROPERTIES` mock data shared as one `useState` in `App.tsx`.
- **Read, approve, reject were already live** (`GET /admin/properties`,
  `PATCH /admin/properties/{id}/approve`, `PATCH /admin/properties/{id}/reject`) — these work
  today with no backend deploy needed.
- **Create, update, delete, and get-one were NEW backend routes added by this project**
  (`POST/PATCH/DELETE /admin/properties`, `GET /admin/properties/{id}`, plus three new
  permissions `PROPERTY_CREATE`/`PROPERTY_UPDATE`/`PROPERTY_DELETE` in
  `misra-api-nest/src/common/enums/permission.enum.ts` and routes in
  `admin-property.controller.ts`) — **confirmed deployed and live on `misra-test`**
  (verified directly: hitting them with a valid origin/key returns a plain JWT
  `"Unauthorized"`, not a 404). A Super Admin's `Permission.ALL` bypasses the new
  permissions automatically (see `PermissionsGuard`) — no role/permission database change
  is needed, only for non-Super-Admin roles that should get these permissions explicitly.
- **Active/inactive toggle deliberately does NOT use `updateIsActive()`.** That existing
  service method filters by `{_id, userId}` (ownership-checked) and would 404 for any
  property an admin doesn't own. The admin route instead goes through the generic
  `PATCH /admin/properties/{id}` (`update()`), which has no such filter.
- **Pagination shape is `{ data, meta: { total, page, limit, totalPages } }`** — confirmed
  from `property.service.ts`'s `findAllForAdmin`, which wraps a `PaginatedDataDto` result into
  this `meta`-nested shape. This is a DIFFERENT field naming than `bookings`' flat
  `{ data, currentPage, totalCount, totalPages }` — don't copy one convention into the other.
- **Mapper layer, not a type change.** `src/types.ts`'s flat `Property` interface (`name`,
  `image`, `price`, `hostName`, capitalized `status`, etc.) was kept as-is; `mappers.ts`'s
  `apiPropertyToViewModel()` translates the real nested/lowercase backend shape into it, so
  every card/list/detail renderer kept working unchanged. Consequence: `type` on the
  view-model is populated from the backend's real `propertyType` (`APARTMENT`/`STUDIO`/
  `VILLA`/`PENTHOUSE`) — it no longer means the mock data's made-up "vibe" category
  (`City`/`Beach`/`Desert`/`Mountain`), which has no backend equivalent at all.
- **Single image only.** `images[0].fullUrl` maps to the view-model's single `image` field;
  create/edit upload exactly one image. Multi-image gallery support is an explicit,
  deliberate follow-up, not an oversight — see the plan this was built from.
- **File upload (`POST /files/upload`) is a brand-new integration for this dashboard** — no
  prior feature to point to, and not yet exercised against a live response. Used by
  `AddListingModal` for the property image and the emiratesId/propertyDoc/tradeLicense
  verification documents (each becomes a `documents[].fileId` entry) before the create call.
- **City picker (`GET /city/active/list`) replaces the old hardcoded
  Dubai/Abu Dhabi/Sharjah/RAK button list** in `AddListingModal`, storing a real `cityId`
  rather than a display string. `Properties/index.tsx`'s geography filter does the same.
- **`PropertyDetailView`'s edit form (`handleSave`) is NOT fully round-tripped.** Its `city`/
  `type` fields are still a hardcoded Dubai/Abu Dhabi/RAK/Sharjah + City/Beach/Desert/Mountain
  picker with no real `cityId` — `viewModelPartialToUpdateRequest()` in `mappers.ts`
  deliberately drops those two fields rather than guessing a mapping. Editing city/type in
  that view has no backend effect; only name/description/beds/baths/price round-trip.
- **`usePropertyActions.ts`'s `updateProperty()` routes by shape, not call site** — it's
  called with three different partial shapes (approve/reject: small `{status, ...}` object;
  active-toggle: `{active}` only; full edit-form save: the entire property, which still
  includes `status`). It disambiguates using `'status' in updates && keys.length <= 3` for
  the approve/reject case specifically so a full-form save (many keys, includes the
  property's current status) doesn't get misrouted into an approve/reject call.

## Categories: how it actually works

- `CategoriesModule.tsx` (route `/admin/categories`) is fully wired against
  `PropertyCategoryController` in the backend (`misra-api-nest/src/modules/property-category/`).
  Nothing was added to the backend for this — every route already existed.
- **"Admin" here means something different than for bookings/properties** — there's no
  `/admin/` prefix. `PropertyCategoryController` puts its admin CRUD routes at the plain
  base path (`/property-categories`, guarded by `@UseGuards(AuthGuard('jwt'))` on the whole
  controller) and its consumer-facing routes at `/property-categories/traveller/*`
  (explicitly `@Public()`, on the *same* controller). Confirmed from the guard placement in
  source, not guessed from the URL shape — this one would've been easy to get backwards.
- **The Swagger `@ApiOkResponse` examples on this controller are misleading** — they show a
  `{ message, data }` shape as if the whole thing is nested inside the envelope's `data`
  (i.e. `response.data.data`). Checked every service method body: they all return the raw
  Mongoose document directly (e.g. `create()` just returns
  `this.propertyCategoryRepo.create(...)`), so the real wire shape is the same single-level
  envelope as everywhere else in this app (`response.data` **is** the category, `message` at
  the top level is just the generic `'Success'`, not the specific per-action text shown in
  the docs).
- **`iconName` is a separate concept from `iconUrl`, and it's required.** `iconUrl` is the
  uploaded image URL (via the same `POST /files/upload` the properties feature already
  uses). `iconName` is a short string that — per
  `misra-api-nest/src/database/seeds/property-category.seeder.ts` — is, for every real
  seeded category, a lowercase slug of the English name (`'City' → 'city'`, `'Beach' →
  'beach'`). Nothing on the backend validates it beyond "non-empty string"; it's presumably
  looked up as a static icon asset name by the mobile app, which this project has no
  visibility into. It's a normal editable text input in `CategoriesModule.tsx`,
  pre-filled live from `slugifyIconName(nameEn)` as a convenience default while creating a
  category — `handleIconNameChange` marks it "touched" the moment the admin edits it
  directly, which stops the auto-fill from overwriting whatever they typed; editing an
  existing category marks it touched immediately too, so opening the edit form never
  silently rewrites a category's existing iconName as you tweak its display name.
  **Caveat**: a brand-new category type has
  no guarantee the mobile app actually has an icon asset matching its auto-derived slug —
  that's a mobile/design coordination question this dashboard can't resolve or enforce.
- **Property-to-category assignment** (`ManageCategoryPropertiesModal.tsx`) uses
  `POST`/`DELETE /property-categories/{id}/properties` (body `{ propertyIds: string[] }`,
  `$addToSet`/`$pull` server-side — safe to call with an already-assigned/unassigned id).
  There's no server-side "search properties not yet in category X" endpoint, so the modal
  fetches one page of up to 200 properties via the existing `listAdminProperties()` and
  filters client-side for both the assigned list and the add-search box — same
  simplification `HostingModule` uses for its own fetch limit. Won't surface every property
  on a catalog larger than that.
- `isActive` has its own dedicated `PATCH /property-categories/{id}/toggle-active` (a flip,
  not a settable value) — controls whether the category shows on the traveler home screen.
  Wired to a toggle pill on each category card; inactive categories render at reduced
  opacity in the admin grid so they're still visible/manageable.
- `displayOrder` is required by the API but has no reordering UI in this pass — new
  categories are auto-appended (`categories.length`), existing ones keep whatever order they
  already have. Manual drag-to-reorder is a separate, not-yet-built feature.

## Banners: how it actually works

- **Entirely new backend module we added ourselves** — no `Banner` concept existed
  anywhere in `misra-api-nest` before. Mirrors `PropertyCategoryController`'s shape and
  conventions exactly (`src/modules/banner/`): localized `title: { en, ar }`, `imageUrl`,
  `link`, `displayOrder`, `isActive`, soft delete via `deletedAt`, `auditPlugin` applied
  (`entityType: 'Banner'`), `BannerRepository extends BaseRepository<BannerDocument>`.
- Routes: `POST/GET /banners`, `GET/PATCH/DELETE /banners/{id}`, `PATCH
  /banners/{id}/toggle-active` — same plain-JWT-guard-no-`/admin/`-prefix pattern as
  categories (not a coincidence; matched on purpose for consistency). Public
  `GET /banners/traveller/active` (`@Public()`) for whatever consumer surface eventually
  needs it — nothing in this dashboard calls that route, it exists for parity with the
  category module's traveler routes.
- Requires a backend deploy before any of it works — this is a brand-new module, not an
  addition to something already live.
- `BannersModule.tsx` follows the exact same loading/error/save-state pattern as
  `CategoriesModule.tsx` (Loader2 spinners, TriangleAlert error banners, disabled buttons +
  inline spinners during in-flight actions). Image upload reuses `uploadFile()` from
  `features/properties/api.ts` — no new upload code needed.

## Elite Nodes (Elite Hosts): how it actually works

- **No new backend concept** — "Elite Hosts" is the seeded HOST-type row in the existing,
  already-live `home-page-listing` module (`misra-api-nest/src/modules/home-page-listing/`).
  That module models generic "curated home-screen sections" via a `catalogueType: 'PROPERTY'
  | 'HOST' | 'NONE'` field; this dashboard finds the section where `catalogueType === 'HOST'`
  and treats its `hostIds` array as the elite-hosts roster. If that seeded section is ever
  deleted, `EliteNodesModule.tsx` shows an explicit "no Elite Hosts section configured"
  empty state rather than guessing or fabricating one.
- **Three data sources are combined, on purpose, because none of them alone is enough:**
  1. `GET /home-page-listings` (admin) — finds the HOST section and its raw, unpopulated
     `hostIds`. This is the only source of truth for *which* hosts are in the section.
  2. `GET /home-page-listings/traveller/all` (public, but called from the admin app
     deliberately) — the only endpoint that resolves those `hostIds` into rich, computed
     objects (`profileImage`, `totalProperties`, `avgRating`, `totalReviews`). **It silently
     omits inactive/suspended hosts** — no flag, they're just absent from the array — so it
     can't be the only source either.
  3. `GET /admin/users?userType=consumer&limit=200` — the only source for `isActive` (the
     public endpoint never exposes it at all) and `isSuperHost`, and backs the "add existing
     host" search picker in `ManageEliteHostsModal.tsx`. Same `limit=200` client-side-filter
     simplification as `ManageCategoryPropertiesModal.tsx` — doesn't scale past that many
     users; revisit if the user base grows.
  `EliteNodesModule.tsx`'s `buildEnrichedHosts()` merges all three: rich stats come from
  the traveller/all lookup when present (`null` in the UI otherwise, shown as "—", never
  fabricated), but `isActive`/`isSuperHost` **always** come from the admin/users lookup,
  never from the public endpoint.
- **Actions**: suspend/activate and Super Host toggle both call `PATCH
  /admin/users/consumer/{id}` (`updateConsumerUser`) — the same endpoint Elite Nodes and any
  future consumer-user-editing feature should reuse. Add/remove from the roster call `POST`/
  `DELETE /home-page-listings/{id}/hosts` (body `{ hostIds: string[] }`).
- **Backend change made for this**: `isSuperHost?: boolean` was added to
  `CreateConsumerUserDto` (flows into `UpdateConsumerUserDto` via `PartialType`) — it wasn't
  settable through any admin endpoint before. Purely additive; no existing behavior for
  users who don't pass this field changes. Requires a backend deploy.
- `App.tsx`'s mock `eliteHosts`/`setEliteHosts` state and the `INITIAL_ELITE_HOSTS`
  import were removed — `<EliteNodesModule />` now takes no props, same as
  Categories/Banners.

## Reviews: how it actually works

- **Consumer-facing review flow (create, list-by-property, host replies) already existed
  and was left untouched** — `ReviewController`/`ReviewService` in
  `misra-api-nest/src/modules/review/`. This dashboard does not call any of those consumer
  routes.
- **There was no admin-facing listing or moderation capability at all before this** — no
  paginated "all reviews" endpoint, no hide/delete, no admin reply. Added:
  - `deletedAt?: Date | null` on the `Review` schema (was previously entirely absent — this
    schema had no soft-delete field, unlike most others in this backend) — additive, so every
    existing review implicitly has `deletedAt: null` already.
  - `auditPlugin(schema, { entityType: 'Review' })` applied (wasn't before) — review
    hide/restore actions now show up in the Notifications/Activity Feed (see below).
  - `AdminReviewController` (`src/modules/review/admin-review.controller.ts`), new file,
    registered alongside the existing `ReviewController` in `review.module.ts`: `GET
    /admin/reviews` (paginated, filters: `propertyId`, `hostId`, `rating`,
    `status: all|visible|hidden`), `GET /admin/reviews/{id}`, `PATCH /admin/reviews/{id}/hide`,
    `PATCH /admin/reviews/{id}/restore`. Same `AuthGuard('jwt') + PermissionsGuard` /
    `Permission.ADMIN_READ` / `Permission.ADMIN_UPDATE` pattern as `AdminBookingController` —
    there's no dedicated `Permission.REVIEW_*` value in the enum, so this reuses the generic
    admin ones, matching that precedent.
  - **"Hide" is a soft moderation action, never a hard delete** — sets `deletedAt`; consumer-
    facing read paths (`getPropertyReviews`, `getAverageRating`,
    `getAverageRatingsForProperties`, `getReviewsForHost`, `getHostRating`) were all updated
    to filter `deletedAt: null`, so a hidden review disappears from public listings/averages
    without the underlying document ever being destroyed. This is a real, live behavior
    change to consumer-facing service methods — but purely additive in effect: since no
    review had a `deletedAt` before this change, every existing review's visibility is
    unaffected until an admin actually hides one.
  - **Important shape lesson, corrected before it shipped**: the new admin service methods
    initially wrapped their return values as `{ message, data }` (following the pattern used
    by the *consumer* review methods, e.g. `getReviewsForHost`'s `ResponseDto`). That's wrong
    for a controller mirroring `AdminBookingController` — its service methods
    (`getAllBookingsForAdmin`, `getBookingByIdForAdmin`, etc.) return raw data directly, and
    the global `TransformResponseInterceptor` only wraps a response **once**
    (`transform-response.interceptor.ts`: if the value doesn't already have `success` on it,
    it wraps it — it does not detect/hoist an inner `{message, data}` shape). Wrapping twice
    would have made the real wire shape `response.data.data` be `{ message, data:
    paginatedThing }` instead of the flat `{ data, currentPage, totalCount, totalPages }` the
    frontend types assume. Fixed by returning the `PaginatedDataDto`/document directly from
    all four new admin methods, matching `AdminBookingController`'s convention exactly. **If
    you add another admin controller later, check which convention its sibling actually
    uses (raw return vs. `ResponseDto`-wrapped) — don't assume by copying the nearest example
    file without checking its own consumer-vs-admin controller has the same wrapping.**
  - `GET /admin/reviews/{id}`'s response reshapes the populated `userId`/`propertyId` fields
    to `user`/`property` (to match the list endpoint's projection) — the frontend's
    `AdminReviewDetail` type expects `user`/`property`, not `userId`/`propertyId`.
  - Requires a backend deploy before any admin review moderation works.
- `ReviewsView.tsx` is fully wired: status filter tabs (All/Visible/Hidden), pagination,
  hide/restore action per card. No tags/helpful-count UI carried over from the old mock —
  those weren't backed by any real field. The "Total Platform Score" stat card was replaced
  with an honest "Moderation Overview" (total + hidden counts) rather than a fabricated
  average — there's no single bulk "average rating across all properties" endpoint to back a
  real platform-wide score.

## Notifications: how it actually works

- **No backend change at all** — this backend has no per-admin notification concept, but
  the audit log module (`misra-api-nest/src/modules/audit-log/`, `AuditLogController` at
  `/admin/audit-logs`) already records every create/update/delete across nearly all schemas
  (Booking, PropertyCategory, User, Banner, Review as of this pass, HomePageListing,
  Setting, SupportHelp, HostingGuide — anywhere `auditPlugin` is applied) and was already
  live before this project touched anything. `NotificationsView.tsx` repurposes it as the
  admin "Activity Feed."
- Response shape confirmed from `AuditLogService.findAll()`: flat `{ data, total, page,
  limit, totalPages }` — same convention as `adminUsers`, a third distinct pagination shape
  from bookings' and properties/categories' (see `features/auditLogs/types.ts` for the full
  callout).
- There's no read/unread field on an audit log entry — the old mock UI's "unread" dot was
  fabricated. Replaced with an honest "changed within the last 24h" recency highlight
  instead of pretending to track read state that doesn't exist server-side.
- Filters: action tabs (All/Created/Updated/Deleted map to the `action` query param) plus
  pagination. No `entityType` filter dropdown in this pass — everything is one combined
  feed; add one later if the volume warrants it.

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

**These MUST be injected wherever `npm run build` runs — including CI.** Vite only reads
them from `.env`/`.env.production` files or actual process env vars at build time; there
is no runtime fallback once the bundle is built. `.env` is (correctly) gitignored, so a
CI workflow that doesn't explicitly set them ships a build with `API_BASE_URL: ''` —
axios then resolves every request against the page's own origin instead of the real API.
This actually happened: `deploy-staging.yml` didn't set them, so the deployed staging
site's login request went to `https://misrah-staging.mvp-apps.ae/admin/auth/login`
(itself — a static file host) instead of the real API, and nginx returned a `405` for a
`POST` to a non-static path. Fixed by adding an `env:` block to that workflow's build
step. The `env.ts` warning for this is also deliberately **not** gated to
`import.meta.env.DEV` anymore, for the same reason — it used to only fire in dev, so this
exact misconfiguration produced zero diagnostic output in the actual broken deployment.

## Known Gaps / TODO

- **RESOLVED**: the staging deploy was blocked by the `x-api-key`'s origin allowlist
  (`ApiKeyGuard` in the backend, `authorizedOrigins` on the `ApiKey` Mongo document) not
  including `https://misrah-staging.mvp-apps.ae` (`401 "Request origin is not
  authorized"` even with a valid key). That allowlist is only populated once, at
  key-creation time, from `WEB_AUTHORIZED_ORIGINS`
  (`misra-api-nest/src/database/seeds/api-key.seeder.ts`) — updating the env var and
  reseeding would NOT have retroactively fixed the already-existing key, and the seeder's
  `reseed()` deletes ALL existing keys (would've broken every other environment using it,
  including local dev). Fixed with a single targeted `$addToSet` on that one document's
  `authorizedOrigins` array — if this happens again for a new environment/domain, that's
  the fix, not a reseed.
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
- **Properties (Hosting Requests, Listings, create/edit/delete) are now integrated** — see
  "Properties: how it actually works" above. Create/update/delete/get-one need a backend
  deploy before they'll work; read/approve/reject already work.
- **Single environment only.** `VITE_API_BASE_URL` points at `misra-test` only. To add
  staging/production: introduce a `VITE_APP_ENV` var and branch on it inside
  `src/config/env.ts` — that's the only file that should need to change.
- **`x-api-key` sensitivity is an assumption, not a confirmation.** Proceeding on the
  read that it's a platform identifier, not a secret, based on the OpenAPI description
  text. If the backend team says otherwise, this needs a proxy/BFF — don't just leave it
  in the client bundle.
- **Category `iconName` auto-derivation is a convention match, not an enforced contract.**
  See "Categories" above — a new category's icon may not actually render on mobile if its
  slug doesn't match a bundled icon asset there. No way to verify this from the admin
  dashboard or backend alone.
- **Category-to-property assignment doesn't scale past ~200 properties** — the "add
  properties" search in `ManageCategoryPropertiesModal.tsx` fetches one page client-side
  rather than querying the server per-keystroke. Fine for now; revisit if the property
  catalog grows.
- **No category reordering UI.** `displayOrder` is required by the API; new categories are
  auto-appended, existing order is otherwise untouched. Drag-to-reorder is unbuilt.
- **Banners, Elite Nodes' `isSuperHost` DTO change, and Reviews' admin moderation endpoints
  all need a backend deploy before they'll work.** Banners and admin review moderation are
  brand-new backend surface (404 until deployed); Elite Nodes' suspend/Super-Host toggles
  will 400/silently no-op on `isSuperHost` until the DTO change ships. Notifications needed
  no backend change and works against whatever's already deployed.
- **Earnings is intentionally not built.** Placed on hold at the user's explicit request,
  pending answers from their team on breakdown granularity, time range, currency, platform
  commission handling, and historical data availability — do not build until those come
  back. `EarningsView.tsx` is still the original hardcoded mock.
- **Elite Nodes' `admin/users?limit=200` fetch doesn't scale** — same caveat as
  category-to-property assignment. The "add existing host" picker in
  `ManageEliteHostsModal.tsx` won't surface every host-eligible user past that many
  consumer accounts.
- **Reviews has no bulk "average rating across the whole platform" endpoint.** The
  Moderation Overview stat card in `ReviewsView.tsx` shows total/hidden counts, not a
  platform-wide average score, because no endpoint computes one in one call (per-property
  and per-host averages exist, a global one doesn't).

## Future: data fetching beyond auth

Auth uses plain `useState`/`useEffect` in a Context because it's global session state
with imperative actions (login/logout), not a typical "fetch and cache" concern. Every
other integrated screen (Bookings, Properties, Categories, Banners, Elite Nodes, Reviews,
Notifications) uses plain `useState`/`useEffect` inside the view/module itself, since it's
just "fetch a page of data for this screen" — each view fetches independently with no
shared cache, so e.g. approving a property in the Hosting queue doesn't live-update an
already-mounted Listings view (it refetches on its own next mount/filter change). As more
screens accumulate this same hand-rolled loading/error/refetch pattern, consider introducing
a proper data-fetching library (e.g. TanStack Query) on top of the same `apiClient` — but
that's a deliberate addition to discuss, not something to bring in silently as a side effect
of one feature. Only `EarningsView` remains fully mock (on hold, see "Known Gaps").
