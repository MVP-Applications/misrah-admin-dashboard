import { apiClient } from '../../api/client';
import { assertResponseShape } from '../../api/assertShape';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type {
  BookingDetail,
  CancelBookingRequest,
  ListBookingsParams,
  ListBookingsResponse,
  RescheduleBookingRequest,
  RescheduleBookingResponse,
} from './types';

// Admin-wide listing. Host Hub uses listHostBookings (/booking/host) below.
export async function listBookings(params: ListBookingsParams = {}): Promise<ListBookingsResponse> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ListBookingsResponse>>(API_ENDPOINTS.bookings.adminAll, {
    params,
  });
  return assertResponseShape('list bookings', data.data, ['data', 'currentPage', 'totalCount', 'totalPages']);
}

// GET /booking/host?page&limit&status — Host Hub stays (bookings on the
// host's own properties). Pagination is flat { page, total, totalPages, data }
// (captured), unlike the admin list's currentPage/totalCount — normalized here
// into ListBookingsResponse so BookingsView handles both the same way.
// Accepts the body with or without the usual { success, data } envelope.
export async function listHostBookings(params: Omit<ListBookingsParams, 'search'> = {}): Promise<ListBookingsResponse> {
  const { data } = await apiClient.get<unknown>(API_ENDPOINTS.bookings.hostAll, { params });
  const envelope = data as Record<string, unknown>;
  const body = (Array.isArray(envelope.data) ? envelope : envelope.data) as Record<string, unknown>;
  const result = assertResponseShape('list host bookings', body, ['data']) as {
    data: ListBookingsResponse['data'];
    page?: number;
    total?: number;
    totalPages?: number;
  };
  return {
    data: result.data,
    currentPage: result.page ?? params.page ?? 1,
    totalCount: result.total ?? result.data.length,
    totalPages: result.totalPages ?? 1,
  };
}

export async function getBookingById(id: string): Promise<BookingDetail> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<BookingDetail>>(API_ENDPOINTS.bookings.adminById(id));
  return assertResponseShape('booking detail', data.data, ['_id', 'checkInDate', 'checkOutDate', 'status']);
}

export async function cancelBooking(id: string, payload: CancelBookingRequest): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.bookings.adminCancel(id), payload);
}

// Hits PATCH /admin/bookings/{id}/reschedule — an endpoint we added to the
// backend ourselves (misra-api-nest), since no admin-capable reschedule
// endpoint existed before. Requires that change to be deployed to misra-test;
// until then this will 404. See API_INTEGRATION.md → "Bookings".
export async function rescheduleBooking(
  id: string,
  payload: RescheduleBookingRequest,
): Promise<RescheduleBookingResponse> {
  const { data } = await apiClient.patch<ApiSuccessEnvelope<RescheduleBookingResponse>>(
    API_ENDPOINTS.bookings.adminReschedule(id),
    payload,
  );
  return assertResponseShape('reschedule booking', data.data, ['_id', 'priceDifference', 'paymentAction']);
}

// Host Hub equivalents of the admin detail/reschedule/cancel calls above:
// GET /booking/{id}, PATCH /booking/{id}/reschedule (RescheduleBookingDto —
// same fields as the admin body), PATCH /booking/{id}/cancel ({ reason? }).
// Reschedule/cancel responses aren't relied on — the caller refetches.
export async function getHostBookingById(id: string): Promise<BookingDetail> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<BookingDetail>>(API_ENDPOINTS.bookings.hostById(id));
  return assertResponseShape('host booking detail', data.data, ['_id', 'checkInDate', 'checkOutDate', 'status']);
}

export async function rescheduleHostBooking(id: string, payload: RescheduleBookingRequest): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.bookings.hostReschedule(id), payload);
}

export async function cancelHostBooking(id: string, payload: CancelBookingRequest): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.bookings.hostCancel(id), payload);
}
