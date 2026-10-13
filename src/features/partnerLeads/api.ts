import { apiClient } from '../../api/client';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import { saveBlobResponse } from '../../api/download';

// POST /partner-leads — public "register interest" form on /partners.
// Needs only the platform x-api-key (added by apiClient), no login.
// Option values are upper-case codes, e.g. offerings STAYS | EXPERIENCES |
// CATERING, joiningTimeline IMMEDIATELY | 1-3 MONTHS | JUST EXPLORING,
// preferredContactMethod PHONE | WHATSAPP | EMAIL | MESSAGE.

export interface PartnerLeadRequest {
  fullName: string;
  businessName: string;
  countryCode: string;
  phoneNumber: string;
  email: string;
  socialMedia?: Array<{ platform: string; handle: string }>;
  offerings: string[];
  cities: string[];
  hasTradeLicense: string; // YES | NO
  joiningTimeline: string;
  reservationManagement?: string[];
  preferredContactMethod: string;
  notes?: string;
}

export async function createPartnerLead(payload: PartnerLeadRequest): Promise<void> {
  await apiClient.post(API_ENDPOINTS.partnerLeads.create, payload);
}

// ---------------------------------------------------------------------------
// Admin → Partner Requests
//   GET    /admin/partner-leads?page&limit&status&search&offering&city
//   PATCH  /admin/partner-leads/{id}/status  { status, adminNotes? }
//   DELETE /admin/partner-leads/{id}
// ---------------------------------------------------------------------------
export type PartnerLeadStatus = 'PENDING' | 'CONTACTED' | 'QUALIFIED' | 'ONBOARDED' | 'REJECTED';

export interface PartnerLead extends PartnerLeadRequest {
  _id: string;
  status: PartnerLeadStatus;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ListPartnerLeadsParams {
  page?: number;
  limit?: number;
  status?: PartnerLeadStatus;
  search?: string;
  offering?: string;
  city?: string;
}

export interface PartnerLeadList {
  items: PartnerLead[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function listPartnerLeads(params: ListPartnerLeadsParams = {}): Promise<PartnerLeadList> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<Record<string, unknown>>>(API_ENDPOINTS.partnerLeads.adminList, { params });
  const body = (data.data ?? {}) as Record<string, unknown>;
  const items = (Array.isArray(body.items) ? body.items : Array.isArray(body.data) ? body.data : []) as PartnerLead[];
  // Pagination may be flat or under `meta` / `pagination`.
  const meta = ((body.meta ?? body.pagination ?? body) as Record<string, unknown>);
  const num = (v: unknown, fallback: number) => (typeof v === 'number' ? v : fallback);
  const limit = num(meta.limit, params.limit ?? 20);
  const total = num(meta.total ?? meta.totalCount ?? meta.totalItems, items.length);
  return {
    items,
    page: num(meta.page ?? meta.currentPage, params.page ?? 1),
    limit,
    total,
    totalPages: num(meta.totalPages, Math.max(1, Math.ceil(total / Math.max(1, limit)))),
  };
}

export async function updatePartnerLeadStatus(id: string, body: { status: PartnerLeadStatus; adminNotes?: string }): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.partnerLeads.adminStatus(id), body);
}

export async function deletePartnerLead(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.partnerLeads.adminById(id));
}

// GET /admin/partner-leads/download-excel — same filters as the list. The
// endpoint is paginated (limit defaults to 20), so ask for every matching row.
export async function downloadPartnerLeadsExcel(params: Omit<ListPartnerLeadsParams, 'page' | 'limit'>, totalRows: number): Promise<string> {
  const response = await apiClient.get<Blob>(API_ENDPOINTS.partnerLeads.adminDownload, {
    params: { ...params, page: 1, limit: Math.max(totalRows, 1000) },
    responseType: 'blob',
  });
  return saveBlobResponse(
    response,
    `misrah-partner-requests-${new Date().toISOString().slice(0, 10)}.xlsx`,
    'The partner requests file could not be generated.',
  );
}
