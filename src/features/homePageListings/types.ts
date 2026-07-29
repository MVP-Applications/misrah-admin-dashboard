// Verified against misra-api-nest/src/modules/home-page-listing/. The admin
// GET routes return raw hostIds/propertyIds (NOT populated) — only the public
// traveller/all route resolves them into rich, computed objects. See
// API_INTEGRATION.md → "Elite Nodes" for why this app calls both.

export type CatalogueType = 'PROPERTY' | 'HOST' | 'NONE';

export interface LocalizedName {
  en: string;
  ar: string;
}

// Admin shape — GET /home-page-listings, GET /home-page-listings/{id}.
export interface AdminHomePageListing {
  _id: string;
  title: LocalizedName;
  subtitle: LocalizedName;
  displayType: string;
  catalogueType: CatalogueType;
  displayOrder: number;
  isActive: boolean;
  propertyIds: string[];
  hostIds: string[];
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ListAdminHomePageListingsResponse = AdminHomePageListing[];

// Public shape — GET /home-page-listings/traveller/all. Only includes
// active, non-deleted sections/hosts/properties — inactive/suspended hosts
// are silently absent, not flagged, which is why the admin view can't rely
// on this alone (see EliteNodesModule.tsx).
export interface TravellerHost {
  _id: string;
  name: string;
  profileImage: string | null;
  isSuperHost: boolean;
  hostSince: string | null;
  memberSince: string;
  totalProperties: number;
  avgRating: number;
  totalReviews: number;
}

export interface TravellerHomePageListing extends AdminHomePageListing {
  hosts?: TravellerHost[];
  properties?: unknown[];
}

export type ListTravellerHomePageListingsResponse = TravellerHomePageListing[];

export interface ManageHostItemsRequest {
  hostIds: string[];
}
