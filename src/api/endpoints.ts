// Central registry of every backend path. Add new endpoints here first —
// no component or feature module should ever hardcode a path string.
// See ../../API_INTEGRATION.md for the conventions this supports.
export const API_ENDPOINTS = {
  // Admin promo codes (live OpenAPI spec).
  promoCodes: {
    adminAll: '/admin/promo-codes',
    adminById: (id: string) => `/admin/promo-codes/${id}`,
    adminToggleActive: (id: string) => `/admin/promo-codes/${id}/toggle-active`,
  },
  // Host Hub → Profile → Hosting Guide.
  // Generic settings documents (e.g. type=legal, key=LEGAL_FRAMEWORK).
  // GET one is readable by any signed-in user; writes are admin-only.
  // Profile → Payment Node (payout bank account). GET · POST (create) · PATCH · DELETE.
  paymentNode: {
    admin: '/admin/payment-node',
    host: '/host/payment-node',
  },
  // Admin → Host Settlements (payout release / decline).
  settlements: {
    list: '/admin/settlements',
    stats: '/admin/settlements/stats',
    byId: (id: string) => `/admin/settlements/${id}`,
    release: (id: string) => `/admin/settlements/${id}/release`,
    decline: (id: string) => `/admin/settlements/${id}/decline`,
    generateBatch: '/admin/settlements/generate-batch',
    // Host Hub — the logged-in host's own settlements (same shapes).
    hostList: '/host/settlements',
    hostById: (id: string) => `/host/settlements/${id}`,
  },
  // Settings screen toggles — admin: platform defaults; host: own settings.
  // Same six boolean fields on both.
  appSettings: {
    admin: '/admin/settings', // GET · PATCH
    hostMe: '/host/settings/me', // GET
    host: '/host/settings', // PATCH
  },
  settings: {
    all: '/settings', // GET list (?type) · POST upsert · DELETE (?type&key)
    one: '/settings/one', // GET ?type&key
    section: '/settings/section', // POST append · PATCH update · DELETE ?key&order&type
  },
  hostingGuide: {
    active: '/hosting-guide/active',
  },
  // Strategic Intel Center channels — GET (host view) / POST { channels } (admin only).
  hostSupport: {
    channels: '/host/support',
  },
  // Current user's profile — GET (read) / PATCH (name, email, phoneNumber, profileImage).
  profile: {
    me: '/consumer/users/profile',
    // PATCH { code } — preferred currency of the logged-in user.
    currency: '/consumer/users/currency',
    // GET / PATCH { bookingActivity, securityAlerts, payoutProcessing, guestFeedback, ... }
    notificationSettings: '/consumer/users/notification-settings',
  },
  // GET — available currencies (admin also manages rates via /currencies/{code}).
  currencies: {
    all: '/currencies',
  },
  // Chat (REST side — sending is over the Socket.IO connection, features/chat/socket.ts).
  chat: {
    conversations: '/chat/conversations',
    messages: (conversationId: string) => `/chat/conversation/${conversationId}/messages`,
    markRead: (conversationId: string) => `/chat/conversation/${conversationId}/read`,
    message: (messageId: string) => `/chat/message/${messageId}`,
  },
  // GET ?year&month — Admin Overview aggregates (see features/dashboard/types.ts).
  dashboard: {
    admin: '/admin/dashboard',
    hostOverview: '/host/dashboard/overview',
    hostEarnings: '/host/dashboard/earnings',
    // GET ?format=xlsx|csv&currency&propertyId → file download.
    hostEarningsAuditReport: '/host/dashboard/earnings/audit-report/download',
  },
  admin: {
    auth: {
      login: '/admin/auth/login',
      refresh: '/admin/auth/refresh',
      logout: '/admin/auth/logout',
      // TODO: not wired up yet — see API_INTEGRATION.md → "Known Gaps".
      forgotPassword: '/admin/auth/forgot-password',
      verifyOtp: '/admin/auth/verify-otp',
      resetPassword: '/admin/auth/reset-password',
      // Profile → Security → Authenticated Sessions.
      sessions: '/admin/auth/sessions',
      sessionById: (id: string) => `/admin/auth/sessions/${id}`,
      logoutAllSessions: '/admin/auth/sessions/logout-all',
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
      // Profile → Update Password: POST { email } emails a reset token, then
      // POST { token, newPassword } with that token.
      forgotPassword: '/host/auth/forgot-password',
      verifyOtp: '/host/auth/verify-otp',
      resetPassword: '/host/auth/reset-password',
      // Profile → Security → Authenticated Sessions (host equivalents).
      sessions: '/host/auth/sessions',
      sessionById: (id: string) => `/host/auth/sessions/${id}`,
      logoutAllSessions: '/host/auth/sessions/logout-all',
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
    // Host Hub: POST — create a listing owned by the logged-in host (CreatePropertyDto).
    create: '/property',
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
    // Host Hub: own reviews + overall rating (page/limit, optional property/experience).
    host: '/review/host',
    // PATCH { message } — reply on a review (200).
    reply: (id: string) => `/review/${id}/reply`,
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
    // Guest Explore catalog — page/limit/search/categoryId/isActive.
    all: '/experience/all',
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
    // Host Hub list — page/limit/status (live OpenAPI spec).
    hostAll: '/experience-booking/host',
    // Host Hub: GET detail, PATCH cancel ({ reason }).
    hostById: (id: string) => `/experience-booking/${id}`,
    hostCancel: (id: string) => `/experience-booking/${id}/cancel`,
    // Traveler/Host: PATCH reschedule (date, timeSlot, guestCount, addOns,
    // reason, pricing) and a no-save pricing preview (POST).
    reschedule: (id: string) => `/experience-booking/${id}/reschedule`,
    reschedulePreview: (id: string) => `/experience-booking/${id}/reschedule/preview`,
    // Admin equivalents (same bodies + currency query param).
    adminReschedule: (id: string) => `/admin/experience-bookings/${id}/reschedule`,
    adminReschedulePreview: (id: string) => `/admin/experience-bookings/${id}/reschedule/preview`,
    // Public: generated time slots + capacity for an experience on ?date=.
    availability: (experienceId: string) => `/experience-booking/availability/${experienceId}`,
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
