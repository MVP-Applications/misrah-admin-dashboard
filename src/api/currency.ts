// The user's preferred currency, applied to every price-bearing request.
//
// apiClient's request interceptor (./client.ts) adds `?currency=<code>` to
// any endpoint in CURRENCY_ROUTES — the routes that take a `currency` query
// param in the live OpenAPI spec — unless the caller already passed one
// (e.g. reschedule, which must use the booking's own currency to match its
// preview). Seeded from the profile on app start (App.tsx) and updated when
// the user switches currency (ProfileView); persisted per browser so it's
// right before the profile loads.

const STORAGE_KEY = 'misrah_preferred_currency';

let preferredCurrency: string | null = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
})();

export function getPreferredCurrency(): string | null {
  return preferredCurrency;
}

export function setPreferredCurrencyCode(code: string | null): void {
  preferredCurrency = code ? code.toUpperCase() : null;
  try {
    if (preferredCurrency) localStorage.setItem(STORAGE_KEY, preferredCurrency);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage unavailable — keep the in-memory value
  }
}

// [method, path] pairs (relative to the API base URL) that accept `currency`
// in the spec. `[^/]+` stands for a path id. Methods matter: e.g. GET
// /property/{id} takes it, PATCH/DELETE on the same path don't.
const CURRENCY_ROUTES: Array<[string, RegExp]> = [
  ['get', /^\/booking\/(my|host)$/],
  ['get', /^\/booking\/[^/]+$/],
  ['patch', /^\/booking\/[^/]+\/reschedule$/],
  ['post', /^\/booking\/[^/]+\/reschedule\/preview$/],
  ['patch', /^\/admin\/bookings\/[^/]+\/reschedule$/],
  ['post', /^\/admin\/bookings\/[^/]+\/reschedule\/preview$/],
  ['get', /^\/host\/dashboard(\/(earnings|overview|financialhub|bookings))?$/],
  ['get', /^\/host\/financial\/(summary|monthly-performance)$/],
  ['get', /^\/host\/(?!auth$|settings$|dashboard$|financial$)[^/]+$/],
  ['get', /^\/property-categories\/traveller\/(all|[^/]+\/properties)$/],
  ['get', /^\/home-page-listings\/traveller\/all$/],
  ['get', /^\/property\/(my|all|[^/]+)$/],
  ['get', /^\/admin\/properties(\/[^/]+)?$/],
  ['get', /^\/experience\/(admin-created|my|all|property\/[^/]+|[^/]+)$/],
  ['get', /^\/admin\/experiences(\/[^/]+)?$/],
  ['get', /^\/experience-booking\/(my|host)$/],
  ['get', /^\/experience-booking\/(?!availability$)[^/]+$/],
  ['patch', /^\/experience-booking\/[^/]+\/reschedule$/],
  ['post', /^\/experience-booking\/[^/]+\/reschedule\/preview$/],
  ['get', /^\/admin\/experience-bookings(\/[^/]+)?$/],
  ['patch', /^\/admin\/experience-bookings\/[^/]+\/reschedule$/],
  ['post', /^\/admin\/experience-bookings\/[^/]+\/reschedule\/preview$/],
  ['get', /^\/wishlist(\/[^/]+)?$/],
  ['patch', /^\/wishlist\/[^/]+$/],
  ['get', /^\/experience-listings\/traveller\/(all|[^/]+)$/],
  ['get', /^\/admin\/dashboard$/],
];

export function routeAcceptsCurrency(method: string | undefined, url: string | undefined): boolean {
  if (!url) return false;
  const verb = (method || 'get').toLowerCase();
  const path = url.split('?')[0].replace(/^https?:\/\/[^/]+/, '');
  return CURRENCY_ROUTES.some(([m, r]) => m === verb && r.test(path));
}
