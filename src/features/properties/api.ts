import { apiClient } from '../../api/client';
import { assertResponseShape } from '../../api/assertShape';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type {
  ApiPropertyListItem,
  AssignHostRequest,
  CityListItem,
  CreatePropertyRequest,
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
  return payload.data;
}
