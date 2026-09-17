// ---------------------------------------------------------------------------
// GET /admin/experiences (list) — the envelope shape (below) is now
// confirmed live: `{ data, meta: { total, page, limit, totalPages } }`,
// matching what was originally assumed by mirroring properties' pagination
// shape. Two different callers have been given two different subsets of
// query params for the same endpoint — ExperiencesView uses
// (page, limit, search, categoryId), BookingsView's Experiences tab uses
// (page, limit, search, status) — so both are kept on ListExperiencesParams;
// presumably the backend accepts either/both as optional filters, though
// that combination itself hasn't been independently confirmed. Individual
// item fields beyond what create/list have each confirmed are still
// UNCONFIRMED (no sibling misra-api-nest checkout was available in this
// workspace — see API_INTEGRATION.md → "Adding a new feature's API
// integration", step 1).
//
// POST /admin/experiences (create) is confirmed — the exact request body
// in CreateExperienceRequest below was captured from a real call that
// returned 201. Its field names (inclusions, addOns, coverPhoto, currency,
// license, numeric `duration` in hours, `isActive` boolean) are used to
// backfill ApiExperienceListItem's guesses below on the assumption
// list/create share one schema — but the create response body itself
// wasn't captured, so createAdminExperience() doesn't parse or assert
// anything about what POST returns; callers should refetch the list instead.
// ---------------------------------------------------------------------------

import type { PriceType } from '../../types';

export interface ListExperiencesParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  // UNCONFIRMED accepted values — this app sends the same Active/Draft/
  // Paused/Sold Out labels ApiExperienceListItem.isActive is mapped to/from
  // elsewhere in this app (see mappers.ts), not a value captured from a
  // real request.
  status?: string;
}

export type ExperiencePricingModel = 'fixed' | 'per_person' | 'hourly';

export interface ApiExperienceAddOn {
  _id?: string;
  title: string;
  titleAr?: string;
  description?: string;
  price: number;
  pricingModel: ExperiencePricingModel;
}

export interface ApiExperienceListItem {
  _id: string;
  propertyId: string;
  // Embedded property summary — assumed present so the list can show which
  // property an experience belongs to without a second round-trip, mirroring
  // how bookings embeds `propertySnapshot`. UNCONFIRMED.
  property?: { _id: string; title: string; city?: string; images?: Array<{ fullUrl: string }> };
  hostId?: string;
  title: string;
  titleAr?: string;
  categoryId: string;
  categoryName?: string;
  categoryNameAr?: string;
  categoryEmoji?: string;
  description: string;
  coverPhoto?: string;
  images: string[];
  price: number;
  currency?: string;
  priceType: PriceType;
  // Hours, e.g. `2` — confirmed numeric from the create payload (NOT the
  // display string, e.g. "2 Hours", this app's local mock data used).
  duration: number;
  minGuests: number;
  maxGuests: number;
  isActive?: boolean;
  timeSlots?: string[];
  inclusions?: string[];
  whatToBring?: string[];
  license?: string;
  addOns?: ApiExperienceAddOn[];
  bookingsCount?: number;
  rating?: number;
  reviewsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListExperiencesResponse {
  data: ApiExperienceListItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface CreateExperienceAddOnRequest {
  title: string;
  titleAr?: string;
  description?: string;
  price: number;
  pricingModel: ExperiencePricingModel;
}

// Confirmed live — this exact shape returns 201.
export interface CreateExperienceRequest {
  title: string;
  titleAr?: string;
  categoryId: string;
  propertyId: string;
  price: number;
  currency: string;
  priceType: PriceType;
  duration: number;
  timeSlots: string[];
  minGuests: number;
  maxGuests: number;
  description: string;
  coverPhoto: string;
  images: string[];
  inclusions: string[];
  whatToBring: string[];
  license?: string;
  addOns?: CreateExperienceAddOnRequest[];
  isActive: boolean;
  hostId?: string;
}

// PATCH /admin/experiences/{id} — confirmed live, given the same field
// shape as create minus `hostId`. Modeled as Partial since it's a PATCH
// (same convention as UpdatePropertyRequest in features/properties/types.ts)
// — the edit form only sends the fields it actually manages (it has no UI
// for categoryId/propertyId/images/inclusions/whatToBring/license), and the
// backend is expected to leave omitted fields untouched.
export type UpdateExperienceRequest = Partial<Omit<CreateExperienceRequest, 'hostId'>>;

// GET /admin/experiences/{id} — response shape assumed to match
// ApiExperienceListItem (same resource as the list). UNCONFIRMED.

// GET /experience-categories — a separate collection from `categories`
// (property-categories, src/features/categories/), requested directly by
// the team. Shape UNCONFIRMED beyond _id/name — mirrored off property
// categories' { name: { en, ar } } convention since no response was
// captured; only _id and name.en/name.ar are relied on anywhere in this app.
export interface ApiExperienceCategory {
  _id: string;
  name: { en: string; ar: string };
  iconName?: string;
  isActive?: boolean;
}

export type ListExperienceCategoriesResponse = ApiExperienceCategory[];
