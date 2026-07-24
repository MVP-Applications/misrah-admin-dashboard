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

// Admin-wide listing — see API_INTEGRATION.md → "Bookings" for why this (not
// /booking/host) is what's wired up: this app has no real host-vs-admin role
// distinction yet, so every logged-in user is currently treated as an admin,
// same as the (now-removed pending redo) Hosting Requests page did.
export async function listBookings(params: ListBookingsParams = {}): Promise<ListBookingsResponse> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ListBookingsResponse>>(API_ENDPOINTS.bookings.adminAll, {
    params,
  });
  return assertResponseShape('list bookings', data.data, ['data', 'currentPage', 'totalCount', 'totalPages']);
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
