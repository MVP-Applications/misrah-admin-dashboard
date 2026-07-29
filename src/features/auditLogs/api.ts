import { apiClient } from '../../api/client';
import { assertResponseShape } from '../../api/assertShape';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type { ListAuditLogsParams, ListAuditLogsResponse } from './types';

export async function listAuditLogs(params: ListAuditLogsParams = {}): Promise<ListAuditLogsResponse> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ListAuditLogsResponse>>(API_ENDPOINTS.auditLogs.all, {
    params,
  });
  return assertResponseShape('list audit logs', data.data, ['data', 'total', 'page', 'totalPages']);
}
