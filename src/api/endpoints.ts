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
} as const;
