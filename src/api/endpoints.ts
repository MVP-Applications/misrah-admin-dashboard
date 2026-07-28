// Central registry of every backend path. Add new endpoints here first —
// no component or feature module should ever hardcode a path string.
// See ../../API_INTEGRATION.md for the conventions this supports.
export const API_ENDPOINTS = {
  admin: {
    auth: {
      login: '/admin/auth/login',
      autologin: '/admin/auth/autologin',
      refresh: '/admin/auth/refresh',
      logout: '/admin/auth/logout',
      // TODO: not wired up yet — see API_INTEGRATION.md → "Known Gaps".
      forgotPassword: '/admin/auth/forgot-password',
      resetPassword: '/admin/auth/reset-password',
    },
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
    // Host-scoped listing — confirmed live earlier, not currently called by the
    // UI (this app has no real host-vs-admin role distinction yet). Kept here
    // for when that's wired up.
    hostAll: '/booking/host',
  },
  properties: {
    // GET/PATCH/POST/DELETE all confirmed to exist in misra-api-nest source
    // (AdminPropertyController). GET .../:id/approve and .../:id/reject were
    // already live before this project touched them. adminAll (POST), adminById
    // (GET one/PATCH/DELETE) were added to the backend by this project — not yet
    // deployed to misra-test. See API_INTEGRATION.md → "Properties".
    adminAll: '/admin/properties',
    adminById: (id: string) => `/admin/properties/${id}`,
    adminApprove: (id: string) => `/admin/properties/${id}/approve`,
    adminReject: (id: string) => `/admin/properties/${id}/reject`,
  },
  files: {
    upload: '/files/upload',
    uploadMultiple: '/files/upload-multiple',
  },
  cities: {
    activeList: '/city/active/list',
  },
} as const;
