import { apiClient } from '../../api/client';
import { assertResponseShape } from '../../api/assertShape';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type {
  ApiPropertyListItem,
  AssignHostRequest,
  CityListItem,
  CreatePropertyRequest,
  ListMyPropertiesParams,
  ListPropertiesParams,
  ListPropertiesResponse,
  UpdatePropertyRequest,
  UploadedFileResult,
} from './types';

// GET /admin/properties — confirmed live before this feature module existed.
export async function listAdminProperties(params: ListPropertiesParams = {}): Promise<ListPropertiesResponse> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ListPropertiesResponse>>(API_ENDPOINTS.properties.adminAll, {
    params,
  });
  return assertResponseShape('list properties', data.data, ['data', 'meta']);
}

// GET /property/my — the logged-in host's own properties, as
// { data: [...] } plus pagination. The pagination block wasn't captured, so
// both conventions this backend uses (`meta: {...}` like admin properties,
// or flat total/page/totalPages like bookings) are normalized into `meta`.
export async function listMyProperties(params: ListMyPropertiesParams = {}): Promise<ListPropertiesResponse> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<unknown>>(API_ENDPOINTS.properties.my, { params });
  const body = data.data as Record<string, unknown> | unknown[];
  if (Array.isArray(body)) {
    return { data: body as ApiPropertyListItem[], meta: { total: body.length, page: 1, limit: body.length, totalPages: 1 } };
  }
  const list = (assertResponseShape('list my properties', body, ['data']) as { data: ApiPropertyListItem[] }).data;
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

// GET /property/{id} — Host Hub property detail. Response body assumed to
// match the admin detail's ApiPropertyListItem (not captured), so only the
// identifying fields are asserted.
export async function getPropertyById(id: string): Promise<ApiPropertyListItem> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ApiPropertyListItem>>(API_ENDPOINTS.properties.byId(id));
  return assertResponseShape('property detail', data.data, ['_id', 'title']);
}

// GET /admin/properties/{id} — added to the backend by this project, requires
// deploy to misra-test before this will work. See API_INTEGRATION.md → "Properties".
export async function getAdminPropertyById(id: string): Promise<ApiPropertyListItem> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ApiPropertyListItem>>(API_ENDPOINTS.properties.adminById(id));
  return assertResponseShape('property detail', data.data, ['_id', 'title', 'status', 'pricing']);
}

// POST /admin/properties — added to the backend by this project, requires
// deploy to misra-test before this will work.
export async function createAdminProperty(payload: CreatePropertyRequest): Promise<ApiPropertyListItem> {
  const { data } = await apiClient.post<ApiSuccessEnvelope<ApiPropertyListItem>>(API_ENDPOINTS.properties.adminAll, payload);
  return assertResponseShape('create property', data.data, ['_id', 'title', 'status']);
}

// POST /property — Host Hub create (CreatePropertyDto). Same fields as the
// admin create minus the owner/onboarding ones; the backend makes the
// logged-in host the owner. Response body isn't relied on — callers refetch.
export async function createMyProperty(payload: CreatePropertyRequest): Promise<void> {
  const { userId, email, phoneNumber, name, nationalId, residentialAddress, password, ...listing } = payload;
  void userId; void email; void phoneNumber; void name; void nationalId; void residentialAddress; void password;
  await apiClient.post(API_ENDPOINTS.properties.create, listing);
}

// PATCH /admin/properties/{id} — added to the backend by this project, requires
// deploy to misra-test before this will work. Also used for the active/inactive
// toggle (body { isActive }) — deliberately NOT the ownership-checked
// updateIsActive() service method, since an admin isn't the property's owner.
export async function updateAdminProperty(id: string, payload: UpdatePropertyRequest): Promise<ApiPropertyListItem> {
  const { data } = await apiClient.patch<ApiSuccessEnvelope<ApiPropertyListItem>>(
    API_ENDPOINTS.properties.adminById(id),
    payload,
  );
  return assertResponseShape('update property', data.data, ['_id', 'title', 'status']);
}

// PATCH /property/{id} — Host Hub edit of the host's own property. The spec
// names the body UpdatePropertyDto without listing fields, so it reuses the
// admin UpdatePropertyRequest. Response not relied on — callers refetch.
export async function updateMyProperty(id: string, payload: UpdatePropertyRequest): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.properties.byId(id), payload);
}

// DELETE /property/{id} — Host Hub delete of the host's own property (200).
export async function deleteMyProperty(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.properties.byId(id));
}

// DELETE /admin/properties/{id} — added to the backend by this project, requires
// deploy to misra-test before this will work. Soft delete (sets deletedAt).
export async function deleteAdminProperty(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.properties.adminById(id));
}

// PATCH /admin/properties/{id}/assign-host — added to the backend by this
// project, requires deploy to misra-test before this will work. Attaches/
// replaces the host on an already-created property (used by "Reassign Node").
// Unlike createAdminProperty, the backend throws a 400 if the submitted
// email/phone already belongs to a user instead of silently merging — see
// AssignHostRequest in features/properties/types.ts.
export async function assignPropertyHost(id: string, payload: AssignHostRequest): Promise<ApiPropertyListItem> {
  const { data } = await apiClient.patch<ApiSuccessEnvelope<ApiPropertyListItem>>(
    API_ENDPOINTS.properties.adminAssignHost(id),
    payload,
  );
  return assertResponseShape('assign host', data.data, ['_id', 'title', 'status']);
}

// PATCH /admin/properties/{id}/approve — confirmed live before this feature
// module existed.
export async function approveAdminProperty(id: string): Promise<ApiPropertyListItem> {
  const { data } = await apiClient.patch<ApiSuccessEnvelope<ApiPropertyListItem>>(API_ENDPOINTS.properties.adminApprove(id));
  return assertResponseShape('approve property', data.data, ['_id', 'status']);
}

// PATCH /admin/properties/{id}/reject — confirmed live before this feature
// module existed.
export async function rejectAdminProperty(id: string, reason?: string): Promise<ApiPropertyListItem> {
  const { data } = await apiClient.patch<ApiSuccessEnvelope<ApiPropertyListItem>>(API_ENDPOINTS.properties.adminReject(id), {
    reason,
  });
  return assertResponseShape('reject property', data.data, ['_id', 'status']);
}

// POST /files/upload — brand-new integration for this dashboard, not yet
// exercised against a live response. See API_INTEGRATION.md → "Properties".
export async function uploadFile(file: File): Promise<UploadedFileResult> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<ApiSuccessEnvelope<UploadedFileResult>>(API_ENDPOINTS.files.upload, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return assertResponseShape('file upload', data.data, ['id', 'url']);
}

// GET /city/active/list — used to populate a real city picker instead of a
// hardcoded city-name list.
//
// Unlike the other calls in this file, this one used to skip response-shape
// validation and just return `data.data` as-is. When that came back
// malformed (e.g. HTML from a misconfigured API base URL instead of JSON),
// `data.data` silently evaluated to `undefined`, which flowed straight into
// PropertiesView's `setCities(undefined)` and crashed the whole route on the
// next render (`cities.map` on undefined) — a blank white page with no
// visible error. assertResponseShape here makes a bad response throw
// (logged, caught by the caller's `.then`/no `.catch` so it never touches
// state) instead of silently corrupting `cities`.
export async function listActiveCities(): Promise<CityListItem[]> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<CityListItem[]>>(API_ENDPOINTS.cities.activeList);
  const payload = assertResponseShape<{ data: CityListItem[] }>('list active cities', data, ['data']);
  if (!Array.isArray(payload.data)) {
    throw new Error(
      "The server's list active cities response doesn't match what this app expects (data is not an array). " +
        'This is a known integration gap — see the browser console and API_INTEGRATION.md.',
    );
  }
  // Names may come back localized ({ en, ar }) — normalize to plain text.
  const text = (v: unknown): string =>
    typeof v === 'string' ? v : v && typeof v === 'object' && typeof (v as { en?: unknown }).en === 'string' ? (v as { en: string }).en : '';
  return payload.data
    .filter(c => c && c.isActive !== false)
    .map(c => ({
      ...c,
      _id: String(c._id),
      name: text(c.name) || 'Unnamed city',
      country: text(c.country) || undefined,
      description: text(c.description) || undefined,
    }));
}
