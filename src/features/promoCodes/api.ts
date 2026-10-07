import { apiClient } from '../../api/client';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type {
  ApiPromoCode,
  CreatePromoCodeRequest,
  ListPromoCodesParams,
  ListPromoCodesResult,
  PromoCode,
  UpdatePromoCodeRequest,
} from './types';

// Admin promo codes — /admin/promo-codes (list/get/create/update/delete,
// /{id}/toggle-active). Mutations' responses aren't relied on beyond success;
// the page refetches.

const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : '');

function fromApi(p: ApiPromoCode): PromoCode {
  return {
    _id: p._id,
    code: p.code,
    description: p.description,
    discountType: p.discountType,
    discountValue: Number(p.discountValue) || 0,
    maxDiscountAmount: p.maxDiscountAmount ?? null,
    minBookingAmount: p.minBookingAmount ?? null,
    currency: p.currency || 'AED',
    appliesTo: p.appliesTo || 'ALL',
    validFrom: toDateInput(p.validFrom),
    validUntil: toDateInput(p.validUntil),
    usageLimit: p.totalUsageLimit ?? null,
    perUserLimit: p.usesPerGuest ?? null,
    usedCount: p.usedCount ?? 0,
    isActive: p.isActive,
    computedStatus: p.computedStatus?.toLowerCase(),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// UI dates are whole days: valid from start of day, until end of day (UTC),
// matching the spec's examples.
function toApi(payload: UpdatePromoCodeRequest): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  const set = (key: string, value: unknown) => { if (value !== undefined) body[key] = value; };
  set('code', payload.code?.trim().toUpperCase());
  set('description', payload.description);
  set('appliesTo', payload.appliesTo);
  set('discountType', payload.discountType);
  set('discountValue', payload.discountValue);
  set('maxDiscountAmount', payload.maxDiscountAmount);
  set('minBookingAmount', payload.minBookingAmount);
  set('validFrom', payload.validFrom ? `${payload.validFrom}T00:00:00.000Z` : undefined);
  set('validUntil', payload.validUntil ? `${payload.validUntil}T23:59:59.999Z` : undefined);
  set('totalUsageLimit', payload.usageLimit);
  set('usesPerGuest', payload.perUserLimit);
  set('isActive', payload.isActive);
  set('currency', payload.currency);
  return body;
}

// GET /admin/promo-codes — pagination envelope not documented: accepts a
// bare array or { data | items | promoCodes: [...] } with total/totalCount
// and totalPages (flat or under meta).
export async function listPromoCodes(params: ListPromoCodesParams = {}): Promise<ListPromoCodesResult> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<unknown>>(API_ENDPOINTS.promoCodes.adminAll, { params });
  const body = data.data as unknown;
  let list: ApiPromoCode[] = [];
  let meta: Record<string, unknown> = {};
  if (Array.isArray(body)) {
    list = body as ApiPromoCode[];
  } else if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>;
    const found = ['data', 'items', 'promoCodes', 'docs'].map(k => obj[k]).find(Array.isArray);
    if (!found) throw new Error('[promo-codes] list response has an unexpected shape.');
    list = found as ApiPromoCode[];
    meta = (obj.meta as Record<string, unknown>) ?? obj;
  }
  const num = (v: unknown, fallback: number) => (typeof v === 'number' ? v : fallback);
  return {
    data: list.map(fromApi),
    totalCount: num(meta.total ?? meta.totalCount, list.length),
    totalPages: num(meta.totalPages, 1),
  };
}

export async function createPromoCode(payload: CreatePromoCodeRequest): Promise<PromoCode | null> {
  const { data } = await apiClient.post<ApiSuccessEnvelope<ApiPromoCode>>(API_ENDPOINTS.promoCodes.adminAll, toApi(payload));
  return data.data?._id ? fromApi(data.data) : null;
}

export async function updatePromoCode(id: string, payload: UpdatePromoCodeRequest): Promise<PromoCode | null> {
  const { data } = await apiClient.patch<ApiSuccessEnvelope<ApiPromoCode>>(API_ENDPOINTS.promoCodes.adminById(id), toApi(payload));
  return data.data?._id ? fromApi(data.data) : null;
}

export async function togglePromoCodeActive(id: string): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.promoCodes.adminToggleActive(id));
}

// Soft delete server-side.
export async function deletePromoCode(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.promoCodes.adminById(id));
}
