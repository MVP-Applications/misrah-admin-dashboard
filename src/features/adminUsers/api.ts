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
