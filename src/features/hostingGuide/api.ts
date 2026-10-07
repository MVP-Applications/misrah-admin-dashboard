import { apiClient } from '../../api/client';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';

// GET /hosting-guide/active — captured response: { message, data: [...] }.

export interface HostingGuide {
  _id: string;
  title: string;
  subtitle?: string;
  iconName?: string; // e.g. "star" — mapped to a lucide icon in ProfileView
  order?: number;
  readTimeMinutes?: number;
  quote?: string;
  body?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export async function listActiveHostingGuides(): Promise<HostingGuide[]> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<HostingGuide[]>>(API_ENDPOINTS.hostingGuide.active);
  if (!Array.isArray(data.data)) throw new Error('[hosting-guide] response is not a list.');
  return [...data.data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
