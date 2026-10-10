import { apiClient } from '../../api/client';
import { assertResponseShape } from '../../api/assertShape';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type { AdminDashboardData, AdminDashboardParams, HostEarningsData, HostEarningsParams } from './types';

// Host Hub equivalent — same data shape, no `header` block.
export async function getHostDashboardOverview(params: AdminDashboardParams = {}): Promise<AdminDashboardData> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<AdminDashboardData>>(API_ENDPOINTS.dashboard.hostOverview, { params });
  return assertResponseShape('host dashboard overview', data.data, ['kpis', 'assetClasses', 'geoHubs', 'activeOps', 'intelFeed']);
}

export async function getAdminDashboard(params: AdminDashboardParams = {}): Promise<AdminDashboardData> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<AdminDashboardData>>(API_ENDPOINTS.dashboard.admin, { params });
  return assertResponseShape('admin dashboard', data.data, ['header', 'kpis', 'assetClasses', 'geoHubs', 'activeOps', 'intelFeed']);
}

// GET /host/dashboard/earnings?timeframe&year&month&ledgerPage&ledgerLimit —
// Host Hub Earnings page (KPIs, revenue matrix, occupancy, momentum, ledger).
export async function getHostEarnings(params: HostEarningsParams = {}): Promise<HostEarningsData> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<HostEarningsData>>(API_ENDPOINTS.dashboard.hostEarnings, { params });
  return assertResponseShape('host earnings', data.data, ['kpis', 'revenueMatrix', 'operationalOccupancy', 'netYieldMomentum', 'ledger']);
}

// GET /host/dashboard/earnings/audit-report/download?format&currency —
// returns the spreadsheet itself. Saves it via a temporary object URL.
export async function downloadHostAuditReport(params: { currency: string; format?: 'xlsx' | 'csv' }): Promise<string> {
  const format = params.format ?? 'xlsx';
  const response = await apiClient.get<Blob>(API_ENDPOINTS.dashboard.hostEarningsAuditReport, {
    params: { format, currency: params.currency },
    responseType: 'blob',
  });
  const blob = response.data;
  // A JSON body here means the server answered with an error envelope.
  if (blob.type.includes('application/json')) {
    const body = JSON.parse(await blob.text()) as { message?: string };
    throw new Error(body.message || 'The audit report could not be generated.');
  }
  const disposition = String(response.headers['content-disposition'] ?? '');
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const fileName = match
    ? decodeURIComponent(match[1])
    : `misrah-earnings-audit-${new Date().toISOString().slice(0, 10)}.${format}`;
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  return fileName;
}
