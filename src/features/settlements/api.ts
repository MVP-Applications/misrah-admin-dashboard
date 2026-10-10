// Host settlements (admin) — payouts owed to hosts, released or declined by
// an admin.
//   GET  /admin/settlements?status&search&page&limit&currency   list
//   GET  /admin/settlements/stats?currency                      tiles + tab counts
//   GET  /admin/settlements/{id}?currency                       detail + line items
//   POST /admin/settlements/{id}/release  { transactionReference?, notes? }
//   POST /admin/settlements/{id}/decline  { reason }
//   POST /admin/settlements/generate-batch { hostId?, cutoffDate?, startDate?, endDate? }
// Host Hub (read-only, own settlements, same response shapes):
//   GET  /host/settlements?status&search&page&limit&currency
//   GET  /host/settlements/{id}?currency

import { apiClient } from '../../api/client';
import { API_ENDPOINTS } from '../../api/endpoints';
import { getPreferredCurrency } from '../../api/currency';
import type { ApiSuccessEnvelope } from '../../api/types';

export type SettlementStatus = 'pending' | 'paid_out' | 'declined';

export interface SettlementHost {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  phone?: string;
}

export interface SettlementPayoutDestination {
  bankName: string;
  accountHolderName: string;
  formattedPayoutTo: string;
  maskedIban: string;
  ibanNumber?: string;
  settlementCurrency: string;
}

export interface Settlement {
  id: string;
  reference: string;
  host: SettlementHost;
  settlementAmount: number;
  formattedSettlementAmount?: string;
  currency: string;
  subtotal?: number;
  serviceFee?: number;
  taxes?: number;
  grossAmount?: number;
  totalPayable?: number;
  period?: { startDate: string; endDate: string; formattedPeriod: string };
  bookingsCount?: number;
  experienceBookingsCount?: number;
  totalBookingsCount?: number;
  amountSubtitle?: string;
  payoutDestination?: SettlementPayoutDestination | null;
  status: SettlementStatus;
  declineReason?: string | null;
  releasedAt?: string | null;
  declinedAt?: string | null;
  createdAt?: string;
}

export interface SettlementStayLine {
  bookingId: string;
  guestName: string;
  propertyTitle: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  settlementAmount: number;
  currency: string;
  serviceFee?: number;
  taxes?: number;
  totalPayable?: number;
}

export interface SettlementExperienceLine {
  bookingId: string;
  guestName: string;
  experienceTitle: string;
  date: string;
  timeSlot: string;
  guestCount: number;
  settlementAmount: number;
  currency: string;
  serviceFee?: number;
  taxes?: number;
  totalPayable?: number;
}

export interface SettlementDetail extends Settlement {
  stayBookings?: SettlementStayLine[];
  experienceBookings?: SettlementExperienceLine[];
  releaseNotes?: string | null;
  releaseTransactionRef?: string | null;
  releasedByName?: string | null;
  declinedByName?: string | null;
}

export interface SettlementMetricCard {
  amount: number;
  currency: string;
  count: number;
  bookingsCount: number;
  experienceBookingsCount: number;
  totalBookingsCount: number;
}

export interface SettlementStats {
  awaitingSettlement: SettlementMetricCard;
  paidOutThisMonth: SettlementMetricCard;
  declined: { count: number; bookingsCount: number; experienceBookingsCount: number; totalBookingsCount: number };
  tabCounts: { pending: number; paidOut: number; declined: number };
}

export interface SettlementListResult {
  items: Settlement[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListSettlementsParams {
  // Currency to convert amounts to — the user's saved currency.
  currency?: string;
  status?: SettlementStatus;
  search?: string;
  page?: number;
  limit?: number;
}

// Every settlement call sends `currency` (required on stats / detail): the
// caller's value, else the saved currency, else AED.
const currencyParam = (override?: string) => (override || getPreferredCurrency() || 'AED').toUpperCase();

const unwrap = <T,>(data: ApiSuccessEnvelope<T> | T): T =>
  (data && typeof data === 'object' && 'data' in (data as object) ? (data as ApiSuccessEnvelope<T>).data : data) as T;

// Settlement `amount` and `settlementAmount` are the same net figure.
const normalize = <T extends Settlement>(raw: T & { amount?: number }, currency?: string): T => ({
  ...raw,
  settlementAmount: typeof raw.settlementAmount === 'number' ? raw.settlementAmount : raw.amount ?? 0,
  currency: raw.currency || currencyParam(currency),
});

export async function listSettlements(
  params: ListSettlementsParams = {},
  scope: 'admin' | 'host' = 'admin',
): Promise<SettlementListResult> {
  const url = scope === 'host' ? API_ENDPOINTS.settlements.hostList : API_ENDPOINTS.settlements.list;
  const currency = currencyParam(params.currency);
  const { data } = await apiClient.get<ApiSuccessEnvelope<SettlementListResult>>(url, {
    params: { ...params, search: params.search || undefined, currency },
  });
  const body = unwrap(data) as Partial<SettlementListResult> & { data?: Settlement[] };
  const items = (body.items ?? body.data ?? []).map(item => normalize(item, currency));
  return {
    items,
    page: body.page ?? params.page ?? 1,
    limit: body.limit ?? params.limit ?? items.length,
    total: body.total ?? items.length,
    totalPages: body.totalPages ?? 1,
  };
}

export async function getSettlementStats(currency?: string): Promise<SettlementStats> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<SettlementStats>>(API_ENDPOINTS.settlements.stats, {
    params: { currency: currencyParam(currency) },
  });
  return unwrap(data);
}

export async function getSettlementDetail(id: string, scope: 'admin' | 'host' = 'admin', currency?: string): Promise<SettlementDetail> {
  const url = scope === 'host' ? API_ENDPOINTS.settlements.hostById(id) : API_ENDPOINTS.settlements.byId(id);
  const cur = currencyParam(currency);
  const { data } = await apiClient.get<ApiSuccessEnvelope<SettlementDetail>>(url, {
    params: { currency: cur },
  });
  return normalize(unwrap(data), cur);
}

export async function releaseSettlement(id: string, body: { transactionReference?: string; notes?: string }): Promise<void> {
  await apiClient.post(API_ENDPOINTS.settlements.release(id), {
    ...(body.transactionReference?.trim() ? { transactionReference: body.transactionReference.trim() } : {}),
    ...(body.notes?.trim() ? { notes: body.notes.trim() } : {}),
  });
}

export async function declineSettlement(id: string, reason: string): Promise<void> {
  await apiClient.post(API_ENDPOINTS.settlements.decline(id), { reason });
}

export async function generateSettlementBatch(body: { startDate?: string; endDate?: string; cutoffDate?: string; hostId?: string }): Promise<void> {
  await apiClient.post(API_ENDPOINTS.settlements.generateBatch, body);
}
