import { apiClient } from '../../api/client';
import { assertResponseShape } from '../../api/assertShape';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type {
  ApiExperienceListItem,
  CreateExperienceRequest,
  ListExperienceCategoriesResponse,
  ListExperiencesParams,
  ListExperiencesResponse,
  UpdateExperienceRequest,
} from './types';

// GET /admin/experiences?page&limit&search&categoryId — UNCONFIRMED, see types.ts.
export async function listAdminExperiences(params: ListExperiencesParams = {}): Promise<ListExperiencesResponse> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ListExperiencesResponse>>(
    API_ENDPOINTS.experiences.adminAll,
    { params },
  );
  return assertResponseShape('list experiences', data.data, ['data', 'meta']);
}

// POST /admin/experiences — confirmed live (this exact request body returns
// 201). The response body itself wasn't captured, so this deliberately
// doesn't parse or assert anything about it — callers should refetch the
// list (listAdminExperiences) to pick up the new row instead of trying to
// read the created record back out of this call.
export async function createAdminExperience(payload: CreateExperienceRequest): Promise<void> {
  await apiClient.post(API_ENDPOINTS.experiences.adminAll, payload);
}

// GET /admin/experiences/{id} — same resource as the list, UNCONFIRMED shape
// (see types.ts). Used to load the current record into the edit form.
export async function getAdminExperienceById(id: string): Promise<ApiExperienceListItem> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ApiExperienceListItem>>(
    API_ENDPOINTS.experiences.adminById(id),
  );
  return assertResponseShape('experience detail', data.data, ['_id', 'title', 'categoryId', 'propertyId']);
}

// PATCH /admin/experiences/{id} — confirmed live, same field shape as
// create minus hostId. Like createAdminExperience, this doesn't parse the
// response — callers should refetch the list instead.
export async function updateAdminExperience(id: string, payload: UpdateExperienceRequest): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.experiences.adminById(id), payload);
}

// DELETE /admin/experiences/{id} — confirmed live, returns 200 (not the
// 204 this app's other delete calls return, but there's no body to parse
// either way) — callers should refetch the list afterward.
export async function deleteAdminExperience(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.experiences.adminById(id));
}

// GET /experience-categories — a distinct collection from the property
// categories in features/categories/ (see API_ENDPOINTS.experienceCategories).
export async function listExperienceCategories(): Promise<ListExperienceCategoriesResponse> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ListExperienceCategoriesResponse>>(
    API_ENDPOINTS.experienceCategories.adminAll,
  );
  if (!Array.isArray(data.data)) {
    throw new Error('[experience-categories] list response is not an array.');
  }
  return data.data;
}
