// ---------------------------------------------------------------------------
// GET /admin/experience-bookings (list, page/limit/search/status) — CONFIRMED
// live, a real captured response. Two things worth flagging against the
// assumptions this module started with:
//   - The envelope is the FLAT `{ data, currentPage, totalCount, totalPages }`
//     shape (same as features/bookings/ property bookings), NOT the
//     `{ data, meta: {...} }` shape features/experiences/ uses for the
//     experiences catalog — those two endpoints do not share a pagination
//     convention despite the similar naming.
//   - There is no `propertySnapshot` — only a bare `propertyId`, so this app
//     cannot show a property name/city for an experience booking without a
//     second lookup. Don't invent one.
// GET /admin/experience-bookings/{id} is assumed to return one of these same
// records — that part is still unconfirmed.
// ---------------------------------------------------------------------------

import type { PriceType } from '../../types';

export interface ListExperienceBookingsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface ExperienceBookingAddOn {
  addOnId?: string;
  _id?: string;
  title: string;
  titleAr?: string;
  description?: string;
  price: number;
  pricingModel: 'fixed' | 'per_person' | 'hourly';
  quantity?: number;
  totalPrice?: number;
}

export interface ExperienceBookingPricing {
  currency: string;
  unitPrice: number;
  priceType: PriceType;
  baseSubtotal: number;
  addOnsTotal: number;
  subtotal: number;
  serviceFee: number;
  taxes: number;
  totalPayable: number;
}

export interface ExperienceBookingCategorySnapshot {
  _id: string;
  name: { en: string; ar: string };
  slug?: string;
  iconName?: string;
}

export interface ExperienceBookingExperienceSnapshot {
  title: string;
  titleAr?: string;
  description?: string;
  coverPhoto?: string;
  images?: string[];
  duration?: number;
  price: number;
  priceType: PriceType;
  currency: string;
  categoryId?: string;
  category?: ExperienceBookingCategorySnapshot;
}

export interface ExperienceBookingContact {
  name: string;
  email: string;
  phone: string;
}

// Shared shape for `traveler`/`host` — note neither carries a profileImage
// on this endpoint (unlike property bookings' traveler/owner).
export interface ExperienceBookingPerson {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
}

export interface ExperienceBookingPayment {
  status: string;
  method?: string;
  paidAt?: string;
}

// The live/current experience catalog record, embedded in full — same
// domain as ApiExperienceListItem (features/experiences/types.ts), but only
// a few fields of it are ever rendered here, so it's kept loose rather than
// importing that type wholesale.
export interface ExperienceBookingCurrentExperience {
  _id: string;
  title: string;
  titleAr?: string;
  images?: string[];
  coverPhoto?: string;
  status?: string;
}

export interface ExperienceBookingListItem {
  _id: string;
  userId?: string;
  experienceId?: string;
  hostId?: string;
  propertyId?: string;
  date: string;
  timeSlot?: string;
  startTime?: string;
  endTime?: string;
  guestCount: number;
  addOns?: ExperienceBookingAddOn[];
  pricing: ExperienceBookingPricing;
  experienceSnapshot: ExperienceBookingExperienceSnapshot;
  contact?: ExperienceBookingContact;
  status: string;
  payment?: ExperienceBookingPayment;
  specialRequests?: string;
  checkedOutAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  traveler?: ExperienceBookingPerson;
  host?: ExperienceBookingPerson;
  currentExperience?: ExperienceBookingCurrentExperience;
}

export interface ListExperienceBookingsResponse {
  currentPage: number;
  totalCount: number;
  totalPages: number;
  data: ExperienceBookingListItem[];
}

// GET /admin/experience-bookings/{id} is assumed to return this same shape —
// unlike the list response above, that assumption itself isn't confirmed.
export type ExperienceBookingDetail = ExperienceBookingListItem;

// PATCH /admin/experience-bookings/{id}/cancel — confirmed live (200), body
// shape given directly. PATCH /admin/experience-bookings/{id}/complete takes
// no body — confirmed live (200), method assumed PATCH to match every other
// action-suffix endpoint in this app (properties' approve/reject, bookings'
// cancel/reschedule).
export interface CancelExperienceBookingRequest {
  reason?: string;
}
