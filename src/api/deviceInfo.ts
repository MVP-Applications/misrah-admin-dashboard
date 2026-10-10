// Optional device headers for the Authenticated Sessions list, sent on auth
// requests (login / refresh / logout / autologin) only:
//   x-device-id        random UUID kept in localStorage (browsers expose no hardware id)
//   x-device-name      "Chrome on macOS" — browsers can't report an exact model
//   x-client-location  "Dubai, United Arab Emirates" — only when location
//                      permission is ALREADY granted; never prompts. Omitted otherwise.
//
// Gated by VITE_SEND_DEVICE_HEADERS=true: the backend's CORS preflight must
// list these headers in Access-Control-Allow-Headers first, or the browser
// blocks every auth request (login included).

import { env } from '../config/env';

const DEVICE_ID_KEY = 'misrah_device_id';
const LOCATION_KEY = 'misrah_client_location';
const LOCATION_TTL_MS = 6 * 60 * 60 * 1000; // re-resolve at most every 6h

export const deviceHeadersEnabled = env.SEND_DEVICE_HEADERS;

// HTTP header values must be ASCII — strip accents and anything else.
const toHeaderValue = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);

const safeGet = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const safeSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable — value just won't persist
  }
};

const randomId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;

export function getDeviceId(): string {
  let id = safeGet(DEVICE_ID_KEY);
  if (!id) {
    id = randomId();
    safeSet(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getDeviceName(): string {
  const ua = navigator.userAgent;
  const browser =
    /Edg\//.test(ua) ? 'Edge'
    : /OPR\//.test(ua) ? 'Opera'
    : /Firefox\//.test(ua) ? 'Firefox'
    : /Chrome\//.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari'
    : 'Browser';
  const os =
    /iPhone/.test(ua) ? 'iPhone'
    : /iPad/.test(ua) ? 'iPad'
    : /Android/.test(ua) ? 'Android'
    : /Mac OS X|Macintosh/.test(ua) ? 'macOS'
    : /Windows/.test(ua) ? 'Windows'
    : /Linux/.test(ua) ? 'Linux'
    : '';
  return toHeaderValue(os ? `${browser} on ${os}` : browser);
}

// Cached "City, Country" (or null). Refreshed in the background by
// refreshClientLocation(); reading it never blocks a request.
export function getClientLocation(): string | null {
  const raw = safeGet(LOCATION_KEY);
  if (!raw) return null;
  try {
    const { value } = JSON.parse(raw) as { value?: string };
    return value ? toHeaderValue(value) || null : null;
  } catch {
    return null;
  }
}

let resolving = false;

// Resolves the city only if geolocation permission is already granted (no
// prompt), via Google reverse geocoding (needs Geocoding API on the key).
export async function refreshClientLocation(): Promise<void> {
  if (resolving || !deviceHeadersEnabled || !env.GOOGLE_MAPS_API_KEY) return;
  try {
    const cached = safeGet(LOCATION_KEY);
    if (cached && Date.now() - ((JSON.parse(cached) as { at?: number }).at ?? 0) < LOCATION_TTL_MS) return;
  } catch {
    // ignore a malformed cache entry
  }
  if (!navigator.permissions?.query || !navigator.geolocation) return;
  resolving = true;
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    if (status.state !== 'granted') return;
    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { maximumAge: LOCATION_TTL_MS, timeout: 10000 }),
    );
    const { latitude, longitude } = pos.coords;
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&result_type=locality|administrative_area_level_1&language=en&key=${encodeURIComponent(env.GOOGLE_MAPS_API_KEY)}`,
    );
    const body = (await res.json()) as { status: string; results?: Array<{ address_components: Array<{ long_name: string; types: string[] }> }> };
    if (body.status !== 'OK' || !body.results?.length) return;
    const parts = body.results[0].address_components;
    const city = parts.find(p => p.types.includes('locality'))?.long_name
      ?? parts.find(p => p.types.includes('administrative_area_level_1'))?.long_name;
    const country = parts.find(p => p.types.includes('country'))?.long_name;
    const value = [city, country].filter(Boolean).join(', ');
    if (value) safeSet(LOCATION_KEY, JSON.stringify({ value, at: Date.now() }));
  } catch {
    // best-effort only
  } finally {
    resolving = false;
  }
}

export function getDeviceHeaders(): Record<string, string> {
  if (!deviceHeadersEnabled) return {};
  const headers: Record<string, string> = {
    'x-device-id': getDeviceId(),
    'x-device-name': getDeviceName(),
  };
  const location = getClientLocation();
  if (location) headers['x-client-location'] = location;
  return headers;
}
