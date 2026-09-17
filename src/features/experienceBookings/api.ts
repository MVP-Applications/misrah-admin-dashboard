import { apiClient } from '../../api/client';
import { assertResponseShape } from '../../api/assertShape';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type {
  CancelExperienceBookingRequest,
  ExperienceBookingDetail,
  ListExperienceBookingsParams,
  ListExperienceBookingsResponse,
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
