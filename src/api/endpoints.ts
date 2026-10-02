// Central registry of every backend path. Add new endpoints here first —
// no component or feature module should ever hardcode a path string.
// See ../../API_INTEGRATION.md for the conventions this supports.
export const API_ENDPOINTS = {
  // GET ?year&month — Admin Overview aggregates (see features/dashboard/types.ts).
  dashboard: {
    admin: '/admin/dashboard',
    hostOverview: '/host/dashboard/overview',
    hostEarnings: '/host/dashboard/earnings',
  },
  admin: {
    auth: {
      login: '/admin/auth/login',
      refresh: '/admin/auth/refresh',
      logout: '/admin/auth/logout',
      // TODO: not wired up yet — see API_INTEGRATION.md → "Known Gaps".
      forgotPassword: '/admin/auth/forgot-password',
      resetPassword: '/admin/auth/reset-password',
    },
  },
  // Neither login nor refresh is shared across portals: a Host Hub session
  // must authenticate/renew here, not at admin.auth.login/admin.auth.refresh,
  // or the backend rejects it (only autologin, below, is genuinely shared).
  // Both confirmed live, return 201 — don't assume either response body
  // shape mirrors admin's beyond what's confirmed in features/auth/types.ts.
  host: {
    auth: {
      login: '/host/auth/login',
      refresh: '/host/auth/refresh',
      // Confirmed live, returns 201. Sends an SMS sign-in code to a host's
      // phone — there is no admin equivalent. Verifying the code isn't wired
      // up yet (no verify endpoint confirmed).
      otpSend: '/host/auth/otp/send',
    },
  },
  // Confirmed live, returns 200 — genuinely shared by both portals (no
  // /admin or /host prefix, unlike login/refresh above), one path for
  // whichever session's refresh token is being redeemed.
  auth: {
    autologin: '/auth/autologin',
  },
  bookings: {
    // Admin-wide listing — confirmed live (backend source: AdminBookingController
    // in misra-api-nest, registered under admin/bookings, requires ADMIN_READ).
    // Not in the Swagger doc we first checked; the deployed spec has since been
    // updated to include it. See API_INTEGRATION.md → "Bookings".
    adminAll: '/admin/bookings',
    adminById: (id: string) => `/admin/bookings/${id}`,
    adminCancel: (id: string) => `/admin/bookings/${id}/cancel`,
    // Added to the backend ourselves (misra-api-nest) — no admin-capable
    // reschedule endpoint existed before. Requires that backend change to be
    // deployed to misra-test before this will work — see API_INTEGRATION.md.
    adminReschedule: (id: string) => `/admin/bookings/${id}/reschedule`,
    // Host Hub stays — listing (page/limit/status), detail, reschedule, cancel.
    hostAll: '/booking/host',
    hostById: (id: string) => `/booking/${id}`,
    hostReschedule: (id: string) => `/booking/${id}/reschedule`,
    hostCancel: (id: string) => `/booking/${id}/cancel`,
  },
  properties: {
    // GET/PATCH/POST/DELETE all confirmed to exist in misra-api-nest source
    // (AdminPropertyController). GET .../:id/approve and .../:id/reject were
    // already live before this project touched them. adminAll (POST), adminById
    // (GET one/PATCH/DELETE) were added to the backend by this project — not yet
    // deployed to misra-test. See API_INTEGRATION.md → "Properties".
    adminAll: '/admin/properties',
    // Host Hub: properties created by the logged-in user (page/limit). Same
    // item shape as adminAll (ApiPropertyListItem).
    my: '/property/my',
    // Host Hub: GET one property by ID (PATCH/DELETE also exist in the spec).
    byId: (id: string) => `/property/${id}`,
    adminById: (id: string) => `/admin/properties/${id}`,
    adminApprove: (id: string) => `/admin/properties/${id}/approve`,
    adminReject: (id: string) => `/admin/properties/${id}/reject`,
    // Attach/replace the host on an existing property — same "hostId OR new
    // host details" shape as create's onboarding fields, but assign-host
    // throws a 400 (rather than silently merging) if the submitted
    // email/phone already belongs to a user. See AssignHostDto in
    // misra-api-nest/src/modules/property/dto/assign-host.dto.ts.
    adminAssignHost: (id: string) => `/admin/properties/${id}/assign-host`,
  },
  categories: {
    // No /admin/ prefix — unlike bookings/properties, "admin" here just means
    // the plain JWT-guarded base routes on PropertyCategoryController, as
    // opposed to its separate @Public() traveller/* routes on the same
    // controller. Confirmed from the guard placement in source, not guessed
    // from naming. All confirmed already live (not added by this project).
    adminAll: '/property-categories',
    adminById: (id: string) => `/property-categories/${id}`,
    adminToggleActive: (id: string) => `/property-categories/${id}/toggle-active`,
    adminProperties: (id: string) => `/property-categories/${id}/properties`,
  },
  // Brand-new backend module we added ourselves (misra-api-nest/src/modules/banner)
  // — no Banner concept existed anywhere before. Mirrors PropertyCategoryController's
  // structure exactly. See API_INTEGRATION.md → "Banners".
  banners: {
    adminAll: '/banners',
    adminById: (id: string) => `/banners/${id}`,
    adminToggleActive: (id: string) => `/banners/${id}/toggle-active`,
  },
  // Same guard pattern as categories — plain JWT-guarded base routes for admin,
  // separate @Public() traveller/* routes on the same controller. Confirmed
  // already live (not added by this project).
  // Home page sections of experiences — all routes in the live OpenAPI spec.
  experienceListings: {
    adminAll: '/experience-listings',
    adminById: (id: string) => `/experience-listings/${id}`,
    adminToggleActive: (id: string) => `/experience-listings/${id}/toggle-active`,
    adminToggleHomepage: (id: string) => `/experience-listings/${id}/toggle-show-on-homepage`,
    // POST adds / DELETE removes { experienceIds }.
    adminExperiences: (id: string) => `/experience-listings/${id}/experiences`,
  },
  homePageListings: {
    adminAll: '/home-page-listings',
    adminById: (id: string) => `/home-page-listings/${id}`,
    adminHosts: (id: string) => `/home-page-listings/${id}/hosts`,
    // POST adds / DELETE removes { propertyIds } — both 200, in the live spec.
    adminProperties: (id: string) => `/home-page-listings/${id}/properties`,
    adminToggleActive: (id: string) => `/home-page-listings/${id}/toggle-active`,
    // Public, but used from the admin app too — it's the only endpoint that
    // returns HOST-type sections with fully populated, computed host stats
    // (totalProperties, avgRating, totalReviews). The admin GET routes above
    // only return raw hostIds. See API_INTEGRATION.md → "Elite Nodes".
    travellerAll: '/home-page-listings/traveller/all',
  },
  adminUsers: {
    all: '/admin/users',
    byId: (id: string) => `/admin/users/${id}`,
    updateConsumer: (id: string) => `/admin/users/consumer/${id}`,
  },
  // Added to the backend ourselves (misra-api-nest/src/modules/review) — no
  // admin-facing listing/moderation endpoints existed before, only consumer
  // routes on ReviewController. Moderation is soft (deletedAt), mirroring the
  // rest of this backend's soft-delete convention. See API_INTEGRATION.md →
  // "Reviews". Requires this backend change to be deployed before it works.
  reviews: {
    adminAll: '/admin/reviews',
    adminById: (id: string) => `/admin/reviews/${id}`,
    adminHide: (id: string) => `/admin/reviews/${id}/hide`,
    adminRestore: (id: string) => `/admin/reviews/${id}/restore`,
  },
  // Already live — no backend change needed. Backs the Notifications/Activity
  // Feed view: this backend has no real per-user notification concept, but
  // the audit log module already records every create/update/delete across
  // most schemas (Booking, PropertyCategory, User, Banner, Review, ...), so
  // it's repurposed as the admin "activity feed". See API_INTEGRATION.md →
  // "Notifications".
  auditLogs: {
    all: '/admin/audit-logs',
  },
  files: {
    upload: '/files/upload',
    uploadMultiple: '/files/upload-multiple',
  },
  cities: {
    activeList: '/city/active/list',
  },
  // Requested directly by the team (page/limit/search/categoryId query params)
  // rather than confirmed against backend source — no sibling misra-api-nest
  // checkout was available in this workspace. See experiences/types.ts.
  experiences: {
    adminAll: '/admin/experiences',
    // Host Hub: experiences created by the logged-in host (page/limit only).
    my: '/experience/my',
    // Host Hub: POST creates an experience owned by the logged-in host (201).
    hostCreate: '/experience',
    // Host Hub: attach the host's experience to properties — { propertyIds }.
    hostAssignProperties: (id: string) => `/experience/${id}/properties`,
    // Host Hub: PATCH = update, DELETE = soft delete the host's own experience.
    byId: (id: string) => `/experience/${id}`,
    adminById: (id: string) => `/admin/experiences/${id}`,
    // Confirmed live — NOT under /admin and singular ("experience"), a
    // genuinely different route from adminAll above, not a typo. Lists
    // admin-authored template experiences (isAdmin: true) for the Curated
    // Catalog tab in ExperiencesView's Add Experience modal.
    adminCreated: '/experience/admin-created',
    // Confirmed live, returns 201. Attaches an EXISTING admin-created
    // template (id from adminCreated above) to one or more properties —
    // the Curated Catalog's "Add Experience" action links the template to
    // whichever property is selected, it does not clone a new experience
    // record the way the Bespoke/Custom form's createAdminExperience does.
    adminAssignProperties: (id: string) => `/admin/experiences/${id}/properties`,
    // PATCH — both in the live OpenAPI spec, 200. Reject takes { reason? }.
    adminApprove: (id: string) => `/admin/experiences/${id}/approve`,
    adminReject: (id: string) => `/admin/experiences/${id}/reject`,
  },
  // A separate collection from `categories` (property-categories) above —
  // requested directly by the team. No `/admin` prefix, mirroring
  // property-categories' plain JWT-guarded convention.
  experienceCategories: {
    // GET = active categories only (dropdowns); POST = create. Both in the
    // live OpenAPI spec (misra-test /api-json), as are the routes below.
    adminAll: '/experience-categories',
    // Paginated, includes inactive — page/limit/search/isActive query params.
    adminList: '/experience-categories/admin/all',
    // GET one / PATCH / DELETE (soft delete).
    adminById: (id: string) => `/experience-categories/${id}`,
  },
  // Distinct from `experiences` above (the catalog/product records) — this
  // is the guest reservation record for one. See features/experienceBookings/types.ts.
  experienceBookings: {
    adminAll: '/admin/experience-bookings',
    adminById: (id: string) => `/admin/experience-bookings/${id}`,
    adminComplete: (id: string) => `/admin/experience-bookings/${id}/complete`,
    adminCancel: (id: string) => `/admin/experience-bookings/${id}/cancel`,
  },
  // Confirmed live — the real status vocabularies for the two booking
  // domains above (Stays' /admin/bookings and Experiences'
  // /admin/experience-bookings). Populate status filter dropdowns from
  // these instead of guessing/hardcoding the option list.
  enums: {
    bookingStatuses: '/enums/booking-statuses',
    experienceBookingStatuses: '/enums/experience-booking-statuses',
  },
} as const;
