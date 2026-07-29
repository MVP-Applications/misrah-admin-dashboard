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
  owner?: { _id: string; name: string; email: string; phoneNumber?: string };
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
}

export type UpdatePropertyRequest = Partial<
  Omit<CreatePropertyRequest, 'userId' | 'email' | 'phoneNumber' | 'name' | 'nationalId' | 'residentialAddress' | 'password'>
>;

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
  | { mode: 'existing'; userId: string; label: string }
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

export interface CityListItem {
  _id: string;
  name: string;
  country?: string;
}
