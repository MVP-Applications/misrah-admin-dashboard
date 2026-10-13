import { apiClient } from '../../api/client';
import { assertResponseShape } from '../../api/assertShape';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type { AdminUserRecord, ListUsersParams, ListUsersResponse, UpdateConsumerUserRequest } from './types';

export async function listUsers(params: ListUsersParams = {}): Promise<ListUsersResponse> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ListUsersResponse>>(API_ENDPOINTS.adminUsers.all, {
    params,
  });
  return assertResponseShape('list users', data.data, ['data', 'total', 'page', 'totalPages']);
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
