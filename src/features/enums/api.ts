import { apiClient } from '../../api/client';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope, EnumOption } from '../../api/types';

// GET /enums/booking-statuses — confirmed live. Backs the Stays tab's
// status filter dropdown in BookingsView.tsx.
export async function listBookingStatuses(): Promise<EnumOption[]> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<EnumOption[]>>(API_ENDPOINTS.enums.bookingStatuses);
  return Array.isArray(data.data) ? data.data : [];
}

// GET /enums/experience-booking-statuses — confirmed live. Backs the
// Experiences tab's status filter dropdown, and the Booking Workflow
// action bar's completed/cancelled gating, in BookingsView.tsx.
export async function listExperienceBookingStatuses(): Promise<EnumOption[]> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<EnumOption[]>>(
    API_ENDPOINTS.enums.experienceBookingStatuses,
  );
  return Array.isArray(data.data) ? data.data : [];
}
