import { apiClient } from '../../api/client';
import { assertResponseShape } from '../../api/assertShape';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type {
  CancelExperienceBookingRequest,
  ExperienceAvailability,
  ExperienceBookingDetail,
  ListExperienceBookingsParams,
  ListExperienceBookingsResponse,
  RescheduleExperienceBookingRequest,
} from './types';

// GET /admin/experience-bookings?page&limit&search&status — confirmed live,
// flat `{ data, currentPage, totalCount, totalPages }` envelope (see types.ts).
export async function listExperienceBookings(
  params: ListExperienceBookingsParams = {},
): Promise<ListExperienceBookingsResponse> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ListExperienceBookingsResponse>>(
    API_ENDPOINTS.experienceBookings.adminAll,
    { params },
  );
  return assertResponseShape('list experience bookings', data.data, ['data', 'currentPage', 'totalCount', 'totalPages']);
}

// GET /experience-booking/host?page&limit&status — Host Hub experience
// bookings. Items reuse ExperienceBookingListItem; the pagination envelope
// wasn't captured, so both conventions this backend uses (flat
// page/total/totalPages like /booking/host, or currentPage/totalCount like the
// admin list) are normalized, with or without the { success, data } wrapper.
export async function listHostExperienceBookings(
  params: Omit<ListExperienceBookingsParams, 'search'> = {},
): Promise<ListExperienceBookingsResponse> {
  const { data } = await apiClient.get<unknown>(API_ENDPOINTS.experienceBookings.hostAll, { params });
  const envelope = data as Record<string, unknown>;
  const body = (Array.isArray(envelope.data) ? envelope : envelope.data) as Record<string, unknown>;
  const result = assertResponseShape('list host experience bookings', body, ['data']) as Record<string, unknown> & {
    data: ListExperienceBookingsResponse['data'];
  };
  const num = (v: unknown, fallback: number) => (typeof v === 'number' ? v : fallback);
  return {
    data: result.data,
    currentPage: num(result.currentPage ?? result.page, params.page ?? 1),
    totalCount: num(result.totalCount ?? result.total, result.data.length),
    totalPages: num(result.totalPages, 1),
  };
}

// GET /admin/experience-bookings/{id} — assumed to return one of the same
// records the list endpoint does; that assumption itself is UNCONFIRMED.
export async function getExperienceBookingById(id: string): Promise<ExperienceBookingDetail> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ExperienceBookingDetail>>(
    API_ENDPOINTS.experienceBookings.adminById(id),
  );
  return assertResponseShape('experience booking detail', data.data, ['_id', 'status', 'pricing']);
}

// PATCH /admin/experience-bookings/{id}/complete — confirmed live (200), no
// request body. Response not parsed — callers should refetch the detail.
export async function completeExperienceBooking(id: string): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.experienceBookings.adminComplete(id));
}

// PATCH /admin/experience-bookings/{id}/cancel — confirmed live (200).
// Response not parsed — callers should refetch the detail.
export async function cancelExperienceBooking(id: string, payload: CancelExperienceBookingRequest): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.experienceBookings.adminCancel(id), payload);
}

// Host Hub equivalents of the admin detail / cancel calls above:
// GET /experience-booking/{id} (assumed same record shape as the admin
// detail) and PATCH /experience-booking/{id}/cancel ({ reason? }, 200 —
// response not parsed, callers refetch).
export async function getHostExperienceBookingById(id: string): Promise<ExperienceBookingDetail> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ExperienceBookingDetail>>(
    API_ENDPOINTS.experienceBookings.hostById(id),
  );
  return assertResponseShape('host experience booking detail', data.data, ['_id', 'status', 'pricing']);
}

export async function cancelHostExperienceBooking(id: string, payload: CancelExperienceBookingRequest): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.experienceBookings.hostCancel(id), payload);
}

// PATCH /experience-booking/{id}/reschedule (200) — response (price
// difference / payment action) not parsed; callers refetch the detail.
// `currency` is a query param (live spec) — pass the booking's currency, the
// same one used for the preview, so the re-validated price matches.
// `asAdmin` routes to PATCH /admin/experience-bookings/{id}/reschedule
// (same body); otherwise the traveler/host /experience-booking route.
export async function rescheduleExperienceBooking(
  id: string,
  payload: RescheduleExperienceBookingRequest,
  currency?: string,
  asAdmin = false,
): Promise<void> {
  const url = asAdmin ? API_ENDPOINTS.experienceBookings.adminReschedule(id) : API_ENDPOINTS.experienceBookings.reschedule(id);
  await apiClient.patch(url, payload, {
    params: currency ? { currency } : undefined,
  });
}

// POST /experience-booking/{id}/reschedule/preview — server-side pricing for
// the proposed change. Confirmed field: `priceDifference` (new − current). A
// new total is also picked up if the response carries one. The reschedule
// call then must send the matching total, or the backend rejects it with
// "Price mismatch: recalculated price difference is X, but received Y".
export interface ExperienceReschedulePreview {
  priceDifference: number | null;
  newTotal: number | null;
}

export async function previewExperienceReschedule(
  id: string,
  payload: Omit<RescheduleExperienceBookingRequest, 'pricing'>,
  currency?: string,
  asAdmin = false,
): Promise<ExperienceReschedulePreview> {
  // Admin: POST /admin/experience-bookings/{id}/reschedule/preview (same body).
  const url = asAdmin
    ? API_ENDPOINTS.experienceBookings.adminReschedulePreview(id)
    : API_ENDPOINTS.experienceBookings.reschedulePreview(id);
  const { data } = await apiClient.post<unknown>(url, payload, {
    params: currency ? { currency } : undefined,
  });
  const body = ((data as Record<string, unknown>)?.data ?? data) as Record<string, any>;
  const pick = (...values: unknown[]) => {
    const found = values.find(v => typeof v === 'number' && Number.isFinite(v));
    return typeof found === 'number' ? found : null;
  };
  return {
    priceDifference: pick(body?.priceDifference, body?.pricing?.priceDifference),
    newTotal: pick(body?.newPricing?.totalPayable, body?.newTotalPayable, body?.newTotal, body?.pricing?.totalPayable, body?.totalPayable),
  };
}

// GET /experience-booking/availability/{experienceId}?date=YYYY-MM-DD —
// public; generated slots + capacity for that date (captured response).
export async function getExperienceAvailability(experienceId: string, date: string): Promise<ExperienceAvailability> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ExperienceAvailability>>(
    API_ENDPOINTS.experienceBookings.availability(experienceId),
    { params: { date } },
  );
  const result = assertResponseShape('experience availability', data.data, ['slots']) as ExperienceAvailability;
  return { ...result, slots: Array.isArray(result.slots) ? result.slots : [] };
}
