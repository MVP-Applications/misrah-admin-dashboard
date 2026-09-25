import { apiClient } from '../../api/client';
import { assertResponseShape } from '../../api/assertShape';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type {
  ApiExperienceCategoryRecord,
  CreateExperienceCategoryRequest,
  ListExperienceCategoriesAdminParams,
  UpdateExperienceCategoryRequest,
} from './types';

// GET /experience-categories/admin/all — includes inactive categories. The
// pagination wrapper isn't documented in the spec, and this backend uses
// several different ones (see features/*/types.ts), so accept a bare array
// or any `{ data | items | docs: [...] }` wrapper rather than guessing one.
export async function listExperienceCategoriesAdmin(
  params: ListExperienceCategoriesAdminParams = {},
): Promise<ApiExperienceCategoryRecord[]> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<unknown>>(API_ENDPOINTS.experienceCategories.adminList, {
    params,
  });
  const body = data.data as unknown;
  if (Array.isArray(body)) return body as ApiExperienceCategoryRecord[];
  if (body && typeof body === 'object') {
    const wrapper = body as Record<string, unknown>;
    for (const key of ['data', 'items', 'docs']) {
      if (Array.isArray(wrapper[key])) return wrapper[key] as ApiExperienceCategoryRecord[];
    }
  }
  throw new Error('[experience-categories] admin list response has an unexpected shape.');
}

export async function createExperienceCategory(
  payload: CreateExperienceCategoryRequest,
): Promise<ApiExperienceCategoryRecord> {
  const { data } = await apiClient.post<ApiSuccessEnvelope<ApiExperienceCategoryRecord>>(
    API_ENDPOINTS.experienceCategories.adminAll,
    payload,
  );
  return assertResponseShape('create experience category', data.data, ['_id', 'name']);
}

export async function updateExperienceCategory(
  id: string,
  payload: UpdateExperienceCategoryRequest,
): Promise<ApiExperienceCategoryRecord> {
  const { data } = await apiClient.patch<ApiSuccessEnvelope<ApiExperienceCategoryRecord>>(
    API_ENDPOINTS.experienceCategories.adminById(id),
    payload,
  );
  return assertResponseShape('update experience category', data.data, ['_id', 'name']);
}

// Soft delete server-side — only success matters, the list is refetched after.
export async function deleteExperienceCategory(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.experienceCategories.adminById(id));
}
