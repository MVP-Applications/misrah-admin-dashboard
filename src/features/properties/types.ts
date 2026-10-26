// ---------------------------------------------------------------------------
// Verified against the actual backend source (misra-api-nest), not the
// Swagger doc — see property.repository.ts (buildOwnerJoinStage,
// buildPropertyDetailsStages, findAllPropertiesForAdmin, findByIdWithDetails)
// and property.service.ts (findAllForAdmin/approve/reject/create/update/remove).
//
// IMPORTANT: the pagination wrapper here is `{ data, meta: { total, page,
// limit, totalPages } }` — a DIFFERENT shape than the `bookings` feature's
// flat `{ data, currentPage, totalCount, totalPages }` (see
// src/features/bookings/types.ts). Do not copy-paste that field naming here.
//
// Also note: `status` is lowercase on the wire (`pending|approved|rejected`),
// unlike the frontend view-model's capitalized `Property.status`.
//
// create/update/delete/get-one and their permissions (PROPERTY_CREATE/UPDATE/
// DELETE) were added to misra-api-nest by this project — not yet independently
// confirmed against a live response until deployed to misra-test. Read/
// approve/reject were already live before this feature module existed.
// ---------------------------------------------------------------------------

export type ApiPropertyStatus = 'pending' | 'approved' | 'rejected';

export interface ApiPropertyListItem {
  _id: string;
  // Optional on the wire — a property created via the "Admin" onboarding
  // path (no host onboarded) has no userId at all (property.schema.ts:
  // `userId?: Types.ObjectId`). Not just an edge case: this is the real
  // "unassigned, managed by admin" state.
  userId?: string;
  cityId?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  title: string;
  // Occupancy / load percentage (e.g. 92.4) — returned by GET /property/{id};
  // shown as "Load" in the detail page's Host Quality Rating section.
  load?: number | string | null;
  description: string;
  propertyType: 'APARTMENT' | 'STUDIO' | 'VILLA' | 'PENTHOUSE';
  maxAdults: number;
  maxChildren?: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  pets: { allowed?: boolean; maxPets?: number };
  amenities: string[];
  documents: Array<{ type: string; fileId: string; uploadedAt: string }>;
  pricing: { basePrice: number; weekdayPrice: number; weekendPrice: number; currency?: string };
  isActive?: boolean;
  status: ApiPropertyStatus;
  rejectionReason?: string;
  avgRating?: number;
  reviewCount?: number;
  owner?: {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    // Host-level review stats (across all their listings).
    reviewsCount?: number;
    totalReviews?: number;
    avgRating?: number;
  };
  city?: { _id: string; name: string; country?: string; description?: string };
  images: Array<{ _id: string; fullUrl: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface ListPropertiesParams {
  page?: number;
  limit?: number;
  status?: ApiPropertyStatus;
  cityId?: string;
  title?: string;
}

// GET /property/my — host's own properties. Items reuse ApiPropertyListItem.
export interface ListMyPropertiesParams {
  page?: number;
  limit?: number;
}

export interface ListPropertiesResponse {
  data: ApiPropertyListItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface CreatePropertyRequest {
  // Exactly one onboarding path applies per AdminCreatePropertyDto: pass
  // userId to list on behalf of an existing host; pass email/phoneNumber
  // (+ optional name/nationalId/residentialAddress/password) to find-or-create
  // that host; pass neither for an unassigned, admin-managed listing. See
  // hostAssignmentToCreateFields() in mappers.ts for how a
  // HostAssignmentSelection becomes these fields. `password` is optional —
  // when omitted, the new host has no way to log in until the (currently
  // unimplemented) forgot/reset-password flow ships.
  userId?: string;
  email?: string;
  phoneNumber?: string;
  name?: string;
  nationalId?: string;
  residentialAddress?: string;
  password?: string;
  title: string;
  description: string;
  propertyType: 'APARTMENT' | 'STUDIO' | 'VILLA' | 'PENTHOUSE';
  maxAdults: number;
  maxChildren?: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  pets: { allowed: boolean; maxPets: number };
  amenities: string[];
  documents: Array<{ type: string; fileId: string }>;
  images?: string[];
  pricing: { basePrice: number; weekdayPrice: number; weekendPrice: number; currency?: string };
  cityId?: string;
  address?: string;
  isActive?: boolean;
  selfCheckInAvailable?: boolean;
  selfCheckInInstruction?: string;
  latitude?: number;
  longitude?: number;
  // Availability window. endDate is omitted when availableForever is true.
  availableForever?: boolean;
  startDate?: string; // ISO, start of day (UTC)
  endDate?: string; // ISO, end of day (UTC)
}

export type UpdatePropertyRequest = Partial<
  Omit<CreatePropertyRequest, 'userId' | 'email' | 'phoneNumber' | 'name' | 'nationalId' | 'residentialAddress' | 'password'>
>;

// Host Hub property drafts — /property/draft. A draft is any subset of the
// create fields plus `step`, the creation-flow step the host saved from
// (AddListingModal's step index). Response shapes weren't documented, so the
// stored fields are typed loosely: populated refs (cityId, images) may come
// back as ids or objects.
//
// Admin drafts (/admin/properties/draft) may also carry the ownership fields
// from the "Who owns this property?" step — except `password`, which is
// never stored in a draft.
export type PropertyDraftRequest = Partial<Omit<CreatePropertyRequest, 'password'>> & {
  step: number;
  // Admin drafts: property categories picked on the Asset Taxonomy step
  // (applied via POST /property-categories/{id}/properties on publish).
  categoryIds?: string[];
};

// Which set of draft routes to use: host (/property/draft) or admin
// (/admin/properties/draft).
export type PropertyDraftScope = 'host' | 'admin';

// A stored file reference — a bare id, or the populated file document.
export type DraftFileRef = string | { _id?: string; id?: string; fullUrl?: string; url?: string };

export interface PropertyDraft extends Omit<PropertyDraftRequest, 'cityId' | 'images' | 'step' | 'userId' | 'documents' | 'categoryIds'> {
  categoryIds?: Array<string | { _id?: string }>;
  _id: string;
  step?: number;
  userId?: string | { _id: string; name?: string };
  owner?: { _id: string; name?: string };
  cityId?: string | { _id: string; name?: string };
  city?: { _id: string; name?: string };
  images?: DraftFileRef[];
  documents?: Array<{ type: string; fileId: DraftFileRef }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListPropertyDraftsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ListPropertyDraftsResponse {
  data: PropertyDraft[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface RejectPropertyRequest {
  reason?: string;
}

// Mirrors AssignHostDto (misra-api-nest/src/modules/property/dto/assign-host.dto.ts).
export interface AssignHostRequest {
  hostId?: string;
  name?: string;
  nationalId?: string;
  phoneNumber?: string;
  email?: string;
  residentialAddress?: string;
  password?: string;
}

// Normalized value HostAssignmentPicker emits — 'admin' (unassigned) is only
// ever offered during creation, never for assign-host (there is no backend
// operation to un-assign a host), so hostAssignmentToAssignHostRequest()
// in mappers.ts never has to handle it. `password` is optional and, when
// provided, must be >= 6 chars (backend's MinLength) — HostAssignmentPicker
// enforces that client-side and only includes the field at all when non-empty.
export type HostAssignmentSelection =
  // email / phoneNumber: the picked user's contact, for display only.
  | { mode: 'existing'; userId: string; label: string; email?: string; phoneNumber?: string }
  | {
      mode: 'new';
      name: string;
      nationalId: string;
      phoneNumber: string;
      email: string;
      residentialAddress: string;
      password?: string;
    }
  | { mode: 'admin' };

export interface UploadedFileResult {
  id: string;
  url: string;
  filename: string;
  size: number;
}

// GET /city/active/list → { success, message, data: CityListItem[] }
export interface CityListItem {
  _id: string;
  name: string;
  country?: string;
  description?: string;
  isActive?: boolean;
}
