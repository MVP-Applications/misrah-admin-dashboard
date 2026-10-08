import { apiClient } from '../../api/client';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';

// Strategic Intel Center — host direct-support channels.
//   GET  /host/support               → { success, message, data: HostSupportChannel[] }
//   POST /host/support { channels }  → same shape (admin only; replaces the whole list)

export interface HostSupportChannel {
  channel: string; // WHATSAPP | TELEGRAM | PHONE | EMAIL
  title: string;
  displayValue: string;
  contactValue?: string;
  actionLabel: string;
  actionUrl: string;
  badge?: string;
  icon?: string;
  isAvailable?: boolean;
}

export const SUPPORT_CHANNEL_TYPES = ['WHATSAPP', 'TELEGRAM', 'PHONE', 'EMAIL'] as const;

const toChannels = (body: unknown): HostSupportChannel[] => {
  const list = Array.isArray(body)
    ? body
    : ((body as Record<string, unknown> | null)?.channels as unknown[] | undefined) ?? [];
  return (list as Array<Record<string, unknown>>).map(c => ({
    channel: String(c.channel ?? ''),
    title: String(c.title ?? ''),
    displayValue: String(c.displayValue ?? ''),
    contactValue: typeof c.contactValue === 'string' ? c.contactValue : undefined,
    actionLabel: String(c.actionLabel ?? ''),
    actionUrl: String(c.actionUrl ?? ''),
    badge: typeof c.badge === 'string' ? c.badge : undefined,
    icon: typeof c.icon === 'string' ? c.icon : undefined,
    isAvailable: c.isAvailable !== false,
  }));
};

export async function getHostSupportChannels(): Promise<HostSupportChannel[]> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<unknown>>(API_ENDPOINTS.hostSupport.channels);
  return toChannels(data.data);
}

export async function setHostSupportChannels(channels: HostSupportChannel[]): Promise<HostSupportChannel[]> {
  const { data } = await apiClient.post<ApiSuccessEnvelope<unknown>>(API_ENDPOINTS.hostSupport.channels, { channels });
  return toChannels(data.data);
}
