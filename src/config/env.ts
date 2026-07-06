// Single source of truth for build-time environment config.
// Every other module reads API config through here — never `import.meta.env` directly.

// TODO: once a staging/production API exists, branch on a VITE_APP_ENV var here
// (e.g. read VITE_API_BASE_URL_PROD / VITE_API_BASE_URL_STAGING) instead of adding
// a second env file or duplicating this logic elsewhere.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const apiKey = import.meta.env.VITE_API_KEY;

if (import.meta.env.DEV) {
  if (!apiBaseUrl) {
    console.error('[env] VITE_API_BASE_URL is not set — API calls will fail. Check your .env file against .env.example.');
  }
  if (!apiKey) {
    console.error('[env] VITE_API_KEY is not set — every API call will be rejected with 401 "API Key is missing". Check your .env file against .env.example.');
  }
}

export const env = {
  API_BASE_URL: apiBaseUrl ?? '',
  API_KEY: apiKey ?? '',
} as const;
