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
  userId: string;
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
  userId: string;
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

export type UpdatePropertyRequest = Partial<Omit<CreatePropertyRequest, 'userId'>>;

export interface RejectPropertyRequest {
  reason?: string;
}

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
