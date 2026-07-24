// Single source of truth for build-time environment config.
// Every other module reads API config through here — never `import.meta.env` directly.

// TODO: once a staging/production API exists, branch on a VITE_APP_ENV var here
// (e.g. read VITE_API_BASE_URL_PROD / VITE_API_BASE_URL_STAGING) instead of adding
// a second env file or duplicating this logic elsewhere.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const apiKey = import.meta.env.VITE_API_KEY;

// Deliberately NOT gated to import.meta.env.DEV: a staging build once shipped with
// this var unset (a CI workflow that never injected it) and produced a confusing,
// silent-in-the-app 405 from nginx instead of ever surfacing this message — because
// the warning only fired in dev. Missing env vars must be loud in every build.
if (!apiBaseUrl) {
  console.error('[env] VITE_API_BASE_URL is not set — API calls will fail. Check your .env file against .env.example, or (for a CI build) the workflow\'s env: block.');
}
if (!apiKey) {
  console.error('[env] VITE_API_KEY is not set — every API call will be rejected with 401 "API Key is missing". Check your .env file against .env.example, or (for a CI build) the workflow\'s env: block.');
}

export const env = {
  API_BASE_URL: apiBaseUrl ?? '',
  API_KEY: apiKey ?? '',
} as const;

// Runtime check (not a build-time env flag) — deliberately so that dev-only
// affordances gated on this (e.g. the mock login in features/auth) can never
// activate just because a build got deployed with the wrong env vars. It only
// ever returns true when the page is actually being served from localhost.
export function isLocalhost(): boolean {
  return typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
}
