import { apiClient } from '../../api/client';
import { assertResponseShape } from '../../api/assertShape';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type { AdminDashboardData, AdminDashboardParams } from './types';

// Host Hub equivalent — same data shape, no `header` block.
export async function getHostDashboardOverview(params: AdminDashboardParams = {}): Promise<AdminDashboardData> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<AdminDashboardData>>(API_ENDPOINTS.dashboard.hostOverview, { params });
  return assertResponseShape('host dashboard overview', data.data, ['kpis', 'assetClasses', 'geoHubs', 'activeOps', 'intelFeed']);
}

export async function getAdminDashboard(params: AdminDashboardParams = {}): Promise<AdminDashboardData> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<AdminDashboardData>>(API_ENDPOINTS.dashboard.admin, { params });
  return assertResponseShape('admin dashboard', data.data, ['header', 'kpis', 'assetClasses', 'geoHubs', 'activeOps', 'intelFeed']);
}
