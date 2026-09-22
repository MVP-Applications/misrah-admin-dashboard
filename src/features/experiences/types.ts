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
  // Confirmed live on GET /admin/experiences/{id} (an admin edit hitting
  // `assertResponseShape` for a missing `propertyId` is what caught this) —
  // plural, an experience can be attached to multiple properties, matching
  // CreateExperienceRequest.propertyIds and assignExperienceToProperties.
  // Not independently confirmed on the LIST response (only by assumption
  // that list/detail share one schema, same caveat as every other field
  // here) but treated the same way for consistency.
  propertyIds: string[];
  // Embedded property summaries — assumed present so the list can show
  // which properties an experience belongs to without a second round-trip,
  // mirroring how bookings embeds `propertySnapshot`, and how the real
  // /experience/admin-created sample embeds a `properties` array alongside
  // its own propertyId/propertyIds. UNCONFIRMED.
  properties?: Array<{ _id: string; title: string; city?: string; images?: Array<{ fullUrl: string }> }>;
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

// Confirmed live — this exact shape returns 201. propertyId was a single
// string in the original captured sample; the team has since changed it to
// propertyIds (plural, array) to let one create call attach the new
// experience to multiple properties at once — mirroring
// assignExperienceToProperties's { propertyIds } shape below.
export interface CreateExperienceRequest {
  title: string;
  titleAr?: string;
  categoryId: string;
  propertyIds: string[];
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

// ---------------------------------------------------------------------------
// GET /experience/admin-created (list, search/categoryId) — confirmed live,
// a real captured item is what AdminCreatedExperience below is modeled on.
// Note the path has no /admin prefix and is singular ("experience", not
// "experiences") — genuinely a different route from admin.experiences above,
// not a typo. The envelope's pagination shape wasn't captured in the sample
// (it was truncated after the first two items), so `meta` here is assumed to
// match /admin/experiences' confirmed `{ total, page, limit, totalPages }`
// convention rather than independently confirmed — assertResponseShape will
// throw immediately if that assumption is wrong.
//
// These are admin-authored template experiences (isAdmin: true) meant to be
// quickly cloned onto a specific host property — that's what backs the
// Curated Catalog tab in ExperiencesView's Add Experience modal. Unlike
// ApiExperienceListItem, every field an admin-created item needs to seed a
// new experience is confirmed directly from the sample, not inferred from
// the create payload.
// ---------------------------------------------------------------------------

export interface AdminCreatedExperienceAddOn {
  _id?: string;
  title: string;
  titleAr?: string;
  description?: string;
  price: number;
  pricingModel: ExperiencePricingModel;
}

export interface AdminCreatedExperienceCategory {
  _id: string;
  name: { en: string; ar: string };
  slug?: string;
  iconName?: string;
  iconUrl?: string | null;
}

export interface AdminCreatedExperienceHost {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  profileImage?: string;
}

export interface AdminCreatedExperience {
  _id: string;
  hostId?: string;
  isAdmin?: boolean;
  createdBy?: string;
  title: string;
  titleAr?: string;
  categoryId: string;
  propertyId?: string;
  price: number;
  currency: string;
  priceType: PriceType;
  duration: number;
  timeSlots: string[];
  addOns?: AdminCreatedExperienceAddOn[];
  minGuests: number;
  maxGuests: number;
  description: string;
  coverPhoto?: string;
  images: string[];
  inclusions?: string[];
  whatToBring?: string[];
  isActive?: boolean;
  status?: string;
  avgRating?: number;
  reviewCount?: number;
  bookingCount?: number;
  createdAt: string;
  updatedAt: string;
  host?: AdminCreatedExperienceHost;
  category?: AdminCreatedExperienceCategory;
}

export interface ListAdminCreatedExperiencesParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
}

export interface ListAdminCreatedExperiencesResponse {
  data: AdminCreatedExperience[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// POST /admin/experiences/{id}/properties — confirmed live, returns 201.
// Attaches an existing (typically admin-created) experience to one or more
// properties, given directly.
export interface AssignExperiencePropertiesRequest {
  propertyIds: string[];
}
