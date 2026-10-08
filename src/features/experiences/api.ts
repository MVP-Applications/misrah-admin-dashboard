import { apiClient } from '../../api/client';
import { assertResponseShape } from '../../api/assertShape';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type {
  ApiExperienceListItem,
  ExperienceApprovalStatus,
  AssignExperiencePropertiesRequest,
  CreateExperienceRequest,
  ListAdminCreatedExperiencesParams,
  ListAdminCreatedExperiencesResponse,
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

// GET /experience/my?page&limit&search&categoryId&propertyId&status&isActive — the
// host's own experiences (status = PENDING | APPROVED | REJECTED), as
// { data: [...] } plus pagination. Items reuse ApiExperienceListItem; the
// pagination block wasn't captured, so `meta: {...}` and flat
// total/page/totalPages are both normalized into `meta`.
export async function listMyExperiences(params: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  propertyId?: string;
  status?: ExperienceApprovalStatus;
  isActive?: boolean;
} = {}): Promise<ListExperiencesResponse> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<unknown>>(API_ENDPOINTS.experiences.my, { params });
  const body = data.data as Record<string, unknown> | unknown[];
  if (Array.isArray(body)) {
    return { data: body as ApiExperienceListItem[], meta: { total: body.length, page: 1, limit: body.length, totalPages: 1 } };
  }
  const list = (assertResponseShape('list my experiences', body, ['data']) as { data: ApiExperienceListItem[] }).data;
  const meta = (body.meta ?? body) as Record<string, unknown>;
  const num = (v: unknown, fallback: number) => (typeof v === 'number' ? v : fallback);
  return {
    data: list,
    meta: {
      total: num(meta.total ?? meta.totalCount, list.length),
      page: num(meta.page ?? meta.currentPage, params.page ?? 1),
      limit: num(meta.limit, params.limit ?? list.length),
      totalPages: num(meta.totalPages, 1),
    },
  };
}

// GET /experience/all?page&limit&search&categoryId — Guest Explore
// catalog (admin + host). Body is { data: [...] } plus pagination; same
// normalization as listMyExperiences since the pagination block wasn't
// captured. Items reuse ApiExperienceListItem.
export async function listAllExperiences(params: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
} = {}): Promise<ListExperiencesResponse> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<unknown>>(API_ENDPOINTS.experiences.all, { params });
  const body = data.data as Record<string, unknown> | unknown[];
  if (Array.isArray(body)) {
    return { data: body as ApiExperienceListItem[], meta: { total: body.length, page: 1, limit: body.length, totalPages: 1 } };
  }
  const list = (assertResponseShape('list all experiences', body, ['data']) as { data: ApiExperienceListItem[] }).data;
  const meta = (body.meta ?? body) as Record<string, unknown>;
  const num = (v: unknown, fallback: number) => (typeof v === 'number' ? v : fallback);
  return {
    data: list,
    meta: {
      total: num(meta.total ?? meta.totalCount, list.length),
      page: num(meta.page ?? meta.currentPage, params.page ?? 1),
      limit: num(meta.limit, params.limit ?? list.length),
      totalPages: num(meta.totalPages, 1),
    },
  };
}

// POST /admin/experiences — confirmed live (this exact request body returns
// 201). The response body itself wasn't captured, so this deliberately
// doesn't parse or assert anything about it — callers should refetch the
// list (listAdminExperiences) to pick up the new row instead of trying to
// read the created record back out of this call.
export async function createAdminExperience(payload: CreateExperienceRequest): Promise<void> {
  await apiClient.post(API_ENDPOINTS.experiences.adminAll, payload);
}

// POST /experience — Host Hub create (201). Same CreateExperienceDto as the
// admin create minus hostId: the backend assigns the logged-in host.
export async function createMyExperience(payload: Omit<CreateExperienceRequest, 'hostId'>): Promise<void> {
  await apiClient.post(API_ENDPOINTS.experiences.hostCreate, payload);
}

// POST /experience/{id}/properties — Host Hub equivalent of
// assignExperienceToProperties (attach the host's own experience to one or
// more of their properties). Response not parsed — callers refetch.
export async function assignMyExperienceToProperties(id: string, payload: AssignExperiencePropertiesRequest): Promise<void> {
  await apiClient.post(API_ENDPOINTS.experiences.hostAssignProperties(id), payload);
}

// GET /admin/experiences/{id} — same resource as the list, UNCONFIRMED shape
// (see types.ts). Used to load the current record into the edit form.
export async function getAdminExperienceById(id: string): Promise<ApiExperienceListItem> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ApiExperienceListItem>>(
    API_ENDPOINTS.experiences.adminById(id),
  );
  return assertResponseShape('experience detail', data.data, ['_id', 'title', 'categoryId', 'propertyIds']);
}

// PATCH /admin/experiences/{id} — confirmed live, same field shape as
// create minus hostId. Like createAdminExperience, this doesn't parse the
// response — callers should refetch the list instead.
export async function updateAdminExperience(id: string, payload: UpdateExperienceRequest): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.experiences.adminById(id), payload);
}

// GET /experience/{id} — public/traveller detail, used by the Host Hub edit
// modal (hosts can't read /admin/experiences/{id}). Its body isn't
// documented and may omit admin-only fields, so only _id/title are asserted
// and the caller merges it over the already-loaded list row.
export async function getExperienceById(id: string): Promise<ApiExperienceListItem> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ApiExperienceListItem>>(API_ENDPOINTS.experiences.byId(id));
  return assertResponseShape('experience detail', data.data, ['_id', 'title']);
}

// PATCH / DELETE /experience/{id} — Host Hub equivalents of the admin calls
// above (update / soft delete the host's own experience). Same body as the
// admin update; responses not relied on — callers refetch.
export async function updateMyExperience(id: string, payload: UpdateExperienceRequest): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.experiences.byId(id), payload);
}

export async function deleteMyExperience(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.experiences.byId(id));
}

// DELETE /admin/experiences/{id} — confirmed live, returns 200 (not the
// 204 this app's other delete calls return, but there's no body to parse
// either way) — callers should refetch the list afterward.
export async function deleteAdminExperience(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.experiences.adminById(id));
}

// PATCH /admin/experiences/{id}/approve and /reject — moderation of a
// PENDING listing. Response bodies aren't relied on; callers refetch.
export async function approveAdminExperience(id: string): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.experiences.adminApprove(id));
}

export async function rejectAdminExperience(id: string, reason?: string): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.experiences.adminReject(id), reason ? { reason } : {});
}

// GET /experience-categories — a distinct collection from the property
// categories in features/categories/ (see API_ENDPOINTS.experienceCategories).
export async function listExperienceCategories(): Promise<ListExperienceCategoriesResponse> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ListExperienceCategoriesResponse>>(
    API_ENDPOINTS.experienceCategories.adminAll,
  );
  // Usually a bare array; accept a { data | items | docs: [...] } wrapper too.
  const body = data.data as unknown;
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object') {
    const wrapper = body as Record<string, unknown>;
    for (const key of ['data', 'items', 'docs']) {
      if (Array.isArray(wrapper[key])) return wrapper[key] as ListExperienceCategoriesResponse;
    }
  }
  throw new Error('[experience-categories] list response has an unexpected shape.');
}

// GET /experience/admin-created?search&categoryId — confirmed live, see
// types.ts for the full shape and why `meta` here is an assumption rather
// than a fully confirmed fact.
export async function listAdminCreatedExperiences(
  params: ListAdminCreatedExperiencesParams = {},
): Promise<ListAdminCreatedExperiencesResponse> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ListAdminCreatedExperiencesResponse>>(
    API_ENDPOINTS.experiences.adminCreated,
    { params },
  );
  return assertResponseShape('list admin-created experiences', data.data, ['data', 'meta']);
}

// POST /admin/experiences/{id}/properties — confirmed live (201). Attaches
// an existing experience to one or more properties; doesn't create a new
// experience record. Response not parsed — callers should refetch the list.
export async function assignExperienceToProperties(
  id: string,
  payload: AssignExperiencePropertiesRequest,
): Promise<void> {
  await apiClient.post(API_ENDPOINTS.experiences.adminAssignProperties(id), payload);
}
