// Host amount settlements (admin) — payouts owed to hosts, approved or
// rejected by an admin.
//
// The backend has NO settlement endpoints yet (checked against /api-json:
// only the host's own /host/payment-node exists). Until it does, this module
// serves an in-memory sample list so the admin screen is fully usable.
// When the API lands, set USE_SAMPLE_DATA = false and fill in ENDPOINTS —
// SettlementsModule only talks to the three functions below.

import { apiClient } from '../../api/client';
import type { ApiSuccessEnvelope } from '../../api/types';

export type SettlementStatus = 'pending' | 'approved' | 'rejected';

export interface Settlement {
  id: string;
  hostId: string;
  hostName: string;
  hostEmail?: string;
  hostAvatar?: string | null;
  amount: number;
  currency: string;
  bookingsCount: number;
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
  payoutDestination?: string; // masked, e.g. "Emirates NBD •••• 4821"
  status: SettlementStatus;
  requestedAt: string; // ISO
  processedAt?: string | null;
  rejectionReason?: string | null;
}

export interface ListSettlementsParams {
  status?: SettlementStatus;
  search?: string;
}

const USE_SAMPLE_DATA = true;

// Fill in once the backend exposes settlements.
const ENDPOINTS = {
  list: '/admin/settlements',
  approve: (id: string) => `/admin/settlements/${id}/approve`,
  reject: (id: string) => `/admin/settlements/${id}/reject`,
};

// ---------------------------------------------------------------------------
// Sample data (in-memory; resets on page reload)
// ---------------------------------------------------------------------------
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

let sampleSettlements: Settlement[] = [
  { id: 'stl-1001', hostId: 'h1', hostName: 'Ahmed Al Mansouri', hostEmail: 'ahmed@example.com', amount: 18450, currency: 'AED', bookingsCount: 7, periodStart: daysAgo(37), periodEnd: daysAgo(7), payoutDestination: 'Emirates NBD •••• 4821', status: 'pending', requestedAt: daysAgo(1) },
  { id: 'stl-1002', hostId: 'h2', hostName: 'Sarah Wilson', hostEmail: 'sarah@example.com', amount: 9620.5, currency: 'AED', bookingsCount: 4, periodStart: daysAgo(37), periodEnd: daysAgo(7), payoutDestination: 'ADCB •••• 1190', status: 'pending', requestedAt: daysAgo(2) },
  { id: 'stl-1003', hostId: 'h3', hostName: 'Tariq Al-Hashimi', hostEmail: 'tariq@example.com', amount: 32100, currency: 'AED', bookingsCount: 11, periodStart: daysAgo(37), periodEnd: daysAgo(7), payoutDestination: 'Mashreq •••• 7734', status: 'pending', requestedAt: daysAgo(2) },
  { id: 'stl-1004', hostId: 'h4', hostName: 'Fatima Rashid', hostEmail: 'fatima@example.com', amount: 4275, currency: 'AED', bookingsCount: 2, periodStart: daysAgo(37), periodEnd: daysAgo(7), payoutDestination: 'FAB •••• 3302', status: 'pending', requestedAt: daysAgo(4) },
  { id: 'stl-0991', hostId: 'h1', hostName: 'Ahmed Al Mansouri', hostEmail: 'ahmed@example.com', amount: 15980, currency: 'AED', bookingsCount: 6, periodStart: daysAgo(67), periodEnd: daysAgo(37), payoutDestination: 'Emirates NBD •••• 4821', status: 'approved', requestedAt: daysAgo(33), processedAt: daysAgo(31) },
  { id: 'stl-0988', hostId: 'h5', hostName: 'James Chen', hostEmail: 'james@example.com', amount: 2140, currency: 'AED', bookingsCount: 1, periodStart: daysAgo(67), periodEnd: daysAgo(37), payoutDestination: 'RAKBANK •••• 0056', status: 'rejected', requestedAt: daysAgo(34), processedAt: daysAgo(32), rejectionReason: 'Payout destination IBAN could not be verified.' },
];

const delay = <T,>(value: T) => new Promise<T>(resolve => setTimeout(() => resolve(value), 350));

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
export async function listSettlements(params: ListSettlementsParams = {}): Promise<Settlement[]> {
  if (!USE_SAMPLE_DATA) {
    const { data } = await apiClient.get<ApiSuccessEnvelope<Settlement[] | { data: Settlement[] }>>(ENDPOINTS.list, { params });
    const body = data.data;
    return Array.isArray(body) ? body : body?.data ?? [];
  }
  const term = params.search?.trim().toLowerCase();
  return delay(
    sampleSettlements
      .filter(s => !params.status || s.status === params.status)
      .filter(s => !term || s.hostName.toLowerCase().includes(term) || (s.hostEmail ?? '').toLowerCase().includes(term) || s.id.toLowerCase().includes(term))
      .sort((a, b) => Date.parse(b.requestedAt) - Date.parse(a.requestedAt)),
  );
}

export async function approveSettlement(id: string): Promise<void> {
  if (!USE_SAMPLE_DATA) {
    await apiClient.patch(ENDPOINTS.approve(id));
    return;
  }
  sampleSettlements = sampleSettlements.map(s =>
    s.id === id ? { ...s, status: 'approved', processedAt: new Date().toISOString(), rejectionReason: null } : s,
  );
  await delay(undefined);
}

export async function rejectSettlement(id: string, reason: string): Promise<void> {
  if (!USE_SAMPLE_DATA) {
    await apiClient.patch(ENDPOINTS.reject(id), { reason });
    return;
  }
  sampleSettlements = sampleSettlements.map(s =>
    s.id === id ? { ...s, status: 'rejected', processedAt: new Date().toISOString(), rejectionReason: reason } : s,
  );
  await delay(undefined);
}

export const isUsingSampleSettlements = USE_SAMPLE_DATA;
