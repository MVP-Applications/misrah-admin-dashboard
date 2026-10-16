import { apiClient } from '../../api/client';
import { assertResponseShape } from '../../api/assertShape';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type {
  AdminUserRecord,
  CheckUserExistsParams,
  CheckUserExistsResponse,
  ListUsersParams,
  ListUsersResponse,
  UpdateConsumerUserRequest,
} from './types';

export async function listUsers(params: ListUsersParams = {}): Promise<ListUsersResponse> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ListUsersResponse>>(API_ENDPOINTS.adminUsers.all, {
    params,
  });
  return assertResponseShape('list users', data.data, ['data', 'total', 'page', 'totalPages']);
}

// GET /admin/users/check-email — used before registering a new owner so we
// don't try to create a user whose email/phone is already taken. Accepts the
// body with or without the usual { success, data } envelope.
export async function checkUserExists(params: CheckUserExistsParams): Promise<CheckUserExistsResponse> {
  const { data } = await apiClient.get<unknown>(API_ENDPOINTS.adminUsers.checkEmail, { params });
  const envelope = data as Record<string, unknown>;
  const body = (typeof envelope.exists === 'boolean' ? envelope : envelope.data) as Record<string, unknown>;
  return assertResponseShape('check user exists', body, ['exists']) as unknown as CheckUserExistsResponse;
}

export async function updateConsumerUser(id: string, payload: UpdateConsumerUserRequest): Promise<AdminUserRecord> {
  const { data } = await apiClient.patch<ApiSuccessEnvelope<AdminUserRecord>>(
    API_ENDPOINTS.adminUsers.updateConsumer(id),
    payload,
  );
  return assertResponseShape('update consumer user', data.data, ['_id', 'isActive']);
}

// DELETE /admin/users/consumer/{id} — removes a consumer user.
export async function deleteConsumerUser(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.adminUsers.updateConsumer(id));
}

// PATCH /admin/users/consumer/{id} without depending on the response body —
// for callers that reload afterwards (Users page edit).
export async function patchConsumerUser(id: string, payload: UpdateConsumerUserRequest): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.adminUsers.updateConsumer(id), payload);
}
