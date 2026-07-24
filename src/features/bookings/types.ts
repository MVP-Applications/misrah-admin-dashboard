// ---------------------------------------------------------------------------
// Verified against the actual backend source (misra-api-nest), not just the
// Swagger doc — its @ApiResponse examples turned out to not match the real
// DTOs (see API_INTEGRATION.md → "Bookings"). Specifically confirmed from
// src/modules/booking/booking.service.ts + booking.repository.ts:
//   - getAllBookingsForAdmin() / getHostBookings() both return a
//     PaginatedDataDto (src/common/dto/response-dto/paginated-dto.ts), whose
//     real fields are `currentPage`/`totalCount`/`totalPages`/`data` — NOT
//     `page`/`total` as the hand-written Swagger example claims.
//   - traveler/owner are populated via `.select('name email phoneNumber')` —
//     no profileImage/avatar field is ever included for these list endpoints.
//   - propertySnapshot.images are raw file-ID strings (`property.images.map(i
//     => i.toString())` at booking-creation time), not resolved URLs, and
//     propertySnapshot.city is never populated for these two endpoints
//     (only for the traveler-facing getMyBookings/getById). Not a problem
//     right now — the UI doesn't render a property image or city for bookings.
// Still NOT independently confirmed via a captured live response (unlike
// auth's shapes) — assertResponseShape will say so immediately if this is
// wrong.
// ---------------------------------------------------------------------------

export interface ListBookingsParams {
  page?: number;
  limit?: number;
}

export interface BookingListItem {
  _id: string;
  propertyId: string;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  guests: {
    adults: number;
    children?: number;
  };
  pricing: {
    currency: string;
    totalPayable: number;
  };
  propertySnapshot: {
    title: string;
    propertyType?: string;
  };
  // Real stored values (booking.schema.ts) — note 'pending' has no dedicated
  // query-filter enum value server-side (only confirmed/ongoing/completed/
  // cancelled), but it's a real value a booking can have.
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | string;
  traveler?: {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
  };
  owner?: {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ListBookingsResponse {
  currentPage: number;
  totalCount: number;
  totalPages: number;
  data: BookingListItem[];
}

// ---------------------------------------------------------------------------
// GET /admin/bookings/{id} — verified from getBookingByIdForAdmin()'s Mongo
// aggregation pipeline (booking.service.ts). Unlike the list endpoints above,
// this ONE actually resolves propertySnapshot.city and .images (to {_id,
// fullUrl} objects), and traveler/owner.profileImage (to a fullUrl string) —
// so the detail view can show a real photo/city where the list can't.
// ---------------------------------------------------------------------------
export interface BookingDetail {
  _id: string;
  propertyId: string;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  guests: { adults: number; children?: number };
  pets?: { bringingPets: boolean; count?: number };
  pricing: {
    currency: string;
    nightlyPrice: number;
    totalNights: number;
    subtotal: number;
    serviceFee: number;
    taxes?: number;
    totalPayable: number;
    discount?: { code?: string; amount?: number };
  };
  propertySnapshot: {
    title: string;
    description?: string;
    propertyType?: string;
    basePrice?: number;
    city?: { _id: string; name: string; country?: string; description?: string };
    images?: Array<{ _id: string; fullUrl: string }>;
  };
  contact?: { name: string; email: string; phone: string };
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | string;
  specialRequests?: string;
  isRescheduled?: boolean;
  rescheduleCount?: number;
  cancellation?: {
    cancelledAt?: string;
    reason?: string;
    refundAmount?: number;
    refundStatus?: string;
  };
  checkedOutAt?: string | null;
  createdAt: string;
  updatedAt: string;
  traveler?: {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    profileImage?: string;
  };
  owner?: {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    profileImage?: string;
  };
}

// Confirmed from CancelBookingDto — cancelBookingForAdmin() defaults `reason`
// to 'Cancelled by Admin' server-side if omitted.
export interface CancelBookingRequest {
  reason?: string;
}

// Confirmed from RescheduleBookingDto.
export interface RescheduleBookingRequest {
  checkInDate: string;
  checkOutDate: string;
  guests: { adults: number; children?: number };
  pets?: { bringingPets: boolean; count?: number };
  reason?: string;
}

// PATCH /admin/bookings/{id}/reschedule is a NEW endpoint we added to the
// backend ourselves (misra-api-nest) — see API_INTEGRATION.md → "Bookings".
// Its response is whatever reschedule() in booking.service.ts returns:
// { ...bookingDoc, traveler, priceDifference, paymentAction }. Only the
// fields this app actually needs are typed/asserted here — after a
// successful reschedule/cancel, refetch the full detail via getBookingById()
// rather than relying on parsing this shape further.
export interface RescheduleBookingResponse {
  _id: string;
  priceDifference: number;
  paymentAction: 'pay_additional' | 'refund' | 'no_change';
}
