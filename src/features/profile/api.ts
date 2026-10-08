import { apiClient } from '../../api/client';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';

// Current user's profile — GET / PATCH /consumer/users/profile ("Get /
// Update current user profile" in the live spec). The GET body isn't
// documented, so fields are read defensively; PATCH takes
// UpdateConsumerProfileDto { name, email, phoneNumber, profileImage } where
// profileImage is a FILE ID (from POST /files/upload) and is REQUIRED — so
// every update re-sends the current image id.

export interface MyProfile {
  name: string;
  email: string;
  phoneNumber: string;
  profileImage: string | null; // display URL
  profileImageId: string | null; // file id to send back on update
  // Preferred currency code (e.g. "AED") — null when the profile has none.
  currency: string | null;
  // Host stats from the profile body — null when absent.
  portfolio: number | null; // listing count
  avgRating: number | null;
}

export interface UpdateMyProfileRequest {
  name?: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string; // file id
}

const OBJECT_ID = /^[a-f\d]{24}$/i;

const text = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.name === 'string') return o.name;
    if (o.name && typeof o.name === 'object' && typeof (o.name as Record<string, unknown>).en === 'string') {
      return (o.name as Record<string, string>).en;
    }
  }
  return '';
};

const toNum = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

// `portfolio` shape isn't documented: a count, a list, or an object of
// counts (e.g. { total } or { properties, experiences }).
const toPortfolioCount = (v: unknown): number | null => {
  if (Array.isArray(v)) return v.length;
  const direct = toNum(v);
  if (direct !== null) return direct;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    const total = toNum(o.total ?? o.count ?? o.totalCount);
    if (total !== null) return total;
    const parts = Object.values(o).map(x => (Array.isArray(x) ? x.length : toNum(x))).filter((x): x is number => x !== null);
    return parts.length ? parts.reduce((a, b) => a + b, 0) : null;
  }
  return null;
};

export async function getMyProfile(): Promise<MyProfile> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<Record<string, any>>>(API_ENDPOINTS.profile.me);
  // Accept { data: user } or { data: { user } }.
  const raw = (data.data?.user ?? data.data ?? {}) as Record<string, any>;
  return {
    name: text(raw.name),
    email: text(raw.email),
    phoneNumber: text(raw.phoneNumber ?? raw.phone ?? raw.mobile),
    profileImage:
      text(raw.profileImage?.fullUrl ?? raw.profileImage?.url ?? raw.profileImageUrl) ||
      (typeof raw.profileImage === 'string' && !OBJECT_ID.test(raw.profileImage) ? raw.profileImage : '') ||
      null,
    portfolio: toPortfolioCount(raw.portfolio),
    avgRating: toNum(raw.avgRating),
    currency: (text(raw.currency?.code ?? raw.currency ?? raw.preferredCurrency) || '').toUpperCase() || null,
    profileImageId:
      (typeof raw.profileImage === 'object' && raw.profileImage ? raw.profileImage._id ?? raw.profileImage.fileId : null) ??
      raw.profileImageId ??
      (typeof raw.profileImage === 'string' && OBJECT_ID.test(raw.profileImage) ? raw.profileImage : null),
  };
}

// PATCH /consumer/users/profile — response not relied on; caller refetches.
export async function updateMyProfile(payload: UpdateMyProfileRequest): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.profile.me, payload);
}

// ---------------------------------------------------------------------------
// Currencies — GET /currencies (list; body undocumented, read defensively)
// and PATCH /consumer/users/currency { code } (preferred currency).
// ---------------------------------------------------------------------------
export interface CurrencyOption {
  code: string;
  name: string;
  symbol?: string;
  isDefault?: boolean;
}

export async function listCurrencies(): Promise<CurrencyOption[]> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<unknown>>(API_ENDPOINTS.currencies.all);
  const body = data.data as unknown;
  const list = Array.isArray(body)
    ? body
    : (['currencies', 'data', 'items'].map(k => (body as Record<string, unknown>)?.[k]).find(Array.isArray) as unknown[]) ?? [];
  return (list as Array<Record<string, any>>)
    .filter(c => c && c.isActive !== false)
    .map(c => ({
      code: String(c.code ?? c.currency ?? '').toUpperCase(),
      name: text(c.name) || String(c.code ?? ''),
      symbol: typeof c.symbol === 'string' ? c.symbol : undefined,
      isDefault: Boolean(c.isDefault ?? c.isBase ?? c.code === 'AED'),
    }))
    .filter(c => c.code);
}

export async function setPreferredCurrency(code: string): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.profile.currency, { code });
}

// DELETE /consumer/users/profile?actionType=host (200) — "deactivate host
// profile" (actionType=both would delete the whole account; not used here).
// Wired to Profile → Security → Logout All for hosts; the caller logs out after.
export async function deactivateHostProfile(): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.profile.me, { params: { actionType: 'host' } });
}

// ---------------------------------------------------------------------------
// Notification settings — GET / PATCH /consumer/users/notification-settings.
// UpdateNotificationSettingsDto is all optional booleans, so each toggle
// PATCHes just its own field. The Notification Center shows the four
// host-facing ones below.
// ---------------------------------------------------------------------------
export interface NotificationSettings {
  bookingActivity: boolean;
  securityAlerts: boolean;
  payoutProcessing: boolean;
  guestFeedback: boolean;
}

export type NotificationSettingKey = keyof NotificationSettings;

const NOTIFICATION_KEYS: NotificationSettingKey[] = ['bookingActivity', 'securityAlerts', 'payoutProcessing', 'guestFeedback'];

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<Record<string, any>>>(API_ENDPOINTS.profile.notificationSettings);
  // Accept the settings flat in data, or nested under notificationSettings/settings.
  const body = (data.data ?? {}) as Record<string, any>;
  const raw = (body.notificationSettings ?? body.settings ?? body) as Record<string, unknown>;
  const settings = {} as NotificationSettings;
  for (const key of NOTIFICATION_KEYS) settings[key] = raw[key] === true;
  return settings;
}

export async function updateNotificationSettings(patch: Partial<NotificationSettings>): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.profile.notificationSettings, patch);
}
