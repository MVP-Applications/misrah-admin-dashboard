import { format, parseISO } from 'date-fns';
import type { Booking } from '../../types';
import type { BookingListItem } from './types';

// Mirrors the backend's own status derivation (applyBookingStatusFilter in
// misra-api-nest/src/modules/booking/booking.service.ts) rather than
// inventing new logic: 'ongoing' there means confirmed + checkInDate <= today
// <= checkOutDate, which is exactly what "Hosting" means in this UI.
export function deriveDisplayStatus(status: string, checkInDate: string, checkOutDate: string): Booking['status'] {
  // Case-insensitive — the API / status enum may send ONGOING or ongoing.
  const s = String(status ?? '').toLowerCase();
  if (s === 'cancelled') return 'Cancelled';
  if (s === 'completed') return 'Past';
  // Set explicitly by the backend / an admin status change — shown as-is
  // rather than falling through to "Pending".
  if (s === 'ongoing') return 'Ongoing';
  if (s === 'confirmed') {
    const now = new Date();
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (checkIn <= now && now <= checkOut) return 'Hosting';
    return 'Confirmed';
  }
  return 'Pending';
}

// Reference shown for a booking: its bookingCode, or (older bookings
// without one) the last 8 characters of its id. Display only — API calls
// always use _id.
export function bookingReference(booking: { _id: string; bookingCode?: string }): string {
  return booking.bookingCode?.trim() || booking._id.slice(-8).toUpperCase();
}

export function formatBookingDate(iso: string): string {
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return iso;
  }
}

// Adapts the real API shape into the legacy Booking shape both BookingsView's
// table and DashboardView's "Active Ops" widget expect — same pattern as
// App.tsx's toLegacyUser. traveler has no avatar/profileImage field on the
// list endpoint (confirmed from the backend's populate
// `.select('name email phoneNumber')`), so guestAvatar is empty here and the
// UI shows a person icon; the detail endpoint DOES resolve a real one.
export function toLegacyBooking(item: BookingListItem): Booking {
  return {
    id: item._id,
    guestName: item.traveler?.name ?? 'Guest',
    guestAvatar: '',
    propertyName: item.propertySnapshot?.title ?? 'Property',
    checkIn: formatBookingDate(item.checkInDate),
    checkOut: formatBookingDate(item.checkOutDate),
    guests: (item.guests?.adults ?? 0) + (item.guests?.children ?? 0),
    total: item.pricing?.totalPayable ?? 0,
    currency: item.pricing?.currency,
    status: deriveDisplayStatus(item.status, item.checkInDate, item.checkOutDate),
  };
}
