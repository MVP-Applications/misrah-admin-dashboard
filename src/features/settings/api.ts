import { apiClient } from '../../api/client';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type { UserRole } from '../../types';

// Settings screen toggles.
//   Admin: GET / PATCH /admin/settings      — platform defaults
//   Host:  GET /host/settings/me, PATCH /host/settings — the host's own
// Both use the same six booleans; PATCH sends only the field that changed.

export interface AppSettings {
  earlyCheckInRequests: boolean;
  aiConcierge: boolean;
  dynamicPricing: boolean;
  emailAlerts: boolean;
  smsNotifications: boolean;
  payoutUpdates: boolean;
}

export type AppSettingKey = keyof AppSettings;

const KEYS: AppSettingKey[] = ['earlyCheckInRequests', 'aiConcierge', 'dynamicPricing', 'emailAlerts', 'smsNotifications', 'payoutUpdates'];

function toSettings(raw: unknown): AppSettings {
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  // Accept the toggles flat, or nested under settings/controls.
  const src = (body.settings ?? body.controls ?? body) as Record<string, unknown>;
  const out = {} as AppSettings;
  for (const key of KEYS) out[key] = src[key] === true;
  return out;
}

export async function getAppSettings(role: UserRole): Promise<AppSettings> {
  const url = role === 'admin' ? API_ENDPOINTS.appSettings.admin : API_ENDPOINTS.appSettings.hostMe;
  try {
    const { data } = await apiClient.get<ApiSuccessEnvelope<unknown>>(url);
    return toSettings(data.data);
  } catch (err) {
    // A host who has never saved settings may have none yet — start from all-off.
    if (role !== 'admin' && (err as { statusCode?: number })?.statusCode === 404) return toSettings({});
    throw err;
  }
}

// PATCH only the changed field(s), e.g. { dynamicPricing: true }.
export async function updateAppSettings(role: UserRole, changed: Partial<AppSettings>): Promise<void> {
  const url = role === 'admin' ? API_ENDPOINTS.appSettings.admin : API_ENDPOINTS.appSettings.host;
  await apiClient.patch(url, changed);
}
