import { apiClient } from '../../api/client';
import { assertResponseShape } from '../../api/assertShape';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type { ApiBanner, CreateBannerRequest, ListBannersResponse, UpdateBannerRequest } from './types';

const REQUIRED_BANNER_FIELDS = ['_id', 'title', 'imageUrl', 'link', 'displayOrder', 'isActive'];

export async function listBanners(): Promise<ListBannersResponse> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ListBannersResponse>>(API_ENDPOINTS.banners.adminAll);
  if (!Array.isArray(data.data)) {
    throw new Error('[banners] list response is not an array — see API_INTEGRATION.md → "Banners".');
  }
  return data.data;
}

export async function createBanner(payload: CreateBannerRequest): Promise<ApiBanner> {
  const { data } = await apiClient.post<ApiSuccessEnvelope<ApiBanner>>(API_ENDPOINTS.banners.adminAll, payload);
  return assertResponseShape('create banner', data.data, REQUIRED_BANNER_FIELDS);
}

export async function updateBanner(id: string, payload: UpdateBannerRequest): Promise<ApiBanner> {
  const { data } = await apiClient.patch<ApiSuccessEnvelope<ApiBanner>>(API_ENDPOINTS.banners.adminById(id), payload);
  return assertResponseShape('update banner', data.data, REQUIRED_BANNER_FIELDS);
}

export async function deleteBanner(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.banners.adminById(id));
}

export async function toggleBannerActive(id: string): Promise<ApiBanner> {
  const { data } = await apiClient.patch<ApiSuccessEnvelope<ApiBanner>>(API_ENDPOINTS.banners.adminToggleActive(id));
  return assertResponseShape('toggle banner active', data.data, REQUIRED_BANNER_FIELDS);
}
