import type { Property } from '../../types';
import type { ApiPropertyListItem, AssignHostRequest, CreatePropertyRequest, HostAssignmentSelection, UpdatePropertyRequest } from './types';

const FALLBACK_IMAGE_URL = '/asets/AdobeStock_46380625.webp';

const STATUS_TO_VIEW_MODEL: Record<ApiPropertyListItem['status'], NonNullable<Property['status']>> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

// Keeps the frontend's flat Property view-model unchanged so every existing
// card/list/detail renderer keeps working as-is — only this function needs to
// know about the backend's real (nested, differently-cased) shape.
export function apiPropertyToViewModel(doc: ApiPropertyListItem): Property {
  return {
    id: doc._id,
    name: doc.title,
    city: doc.city?.name ?? 'Unknown',
    type: doc.propertyType,
    rating: doc.avgRating ?? 0,
    reviews: doc.reviewCount ?? 0,
    price: doc.pricing.basePrice,
    beds: doc.beds,
    baths: doc.bathrooms,
    image: doc.images?.[0]?.fullUrl ?? FALLBACK_IMAGE_URL,
    active: doc.isActive ?? true,
    hostId: doc.owner?._id ?? doc.userId,
    hostName: doc.owner?.name,
    description: doc.description,
    isFeatured: false,
    status: STATUS_TO_VIEW_MODEL[doc.status],
    rejectionReason: doc.rejectionReason,
  };
}

// Reverse-maps the fields PropertyDetailView's edit form actually sends via
// onUpdate(id, Partial<Property>) (handleSave sends the whole formData) — not
// a full inverse of apiPropertyToViewModel. `city`/`type` are deliberately not
// forwarded: PropertyDetailView's edit UI is a hardcoded Dubai/Abu Dhabi/RAK/
// Sharjah + City/Beach/Desert/Mountain picker with no real cityId, and `type`
// there is a mock-only "vibe" category with no backend equivalent (distinct
// from the real `propertyType` enum) — out of scope to add a real city picker
// there per the approved migration plan (only AddListingModal got one).
export function viewModelPartialToUpdateRequest(updates: Partial<Property>): UpdatePropertyRequest {
  const payload: UpdatePropertyRequest = {};
  if (updates.name !== undefined) payload.title = updates.name;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.beds !== undefined) payload.beds = updates.beds;
  if (updates.baths !== undefined) payload.bathrooms = updates.baths;
  if (updates.active !== undefined) payload.isActive = updates.active;
  if (updates.price !== undefined) {
    payload.pricing = { basePrice: updates.price, weekdayPrice: updates.price, weekendPrice: updates.price };
  }
  return payload;
}

// AddListingModal's Ownership step produces a HostAssignmentSelection;
// this is what actually gets spread into the create-property payload — the
// backend resolves 'existing'/'new' into a host user itself (see
// AdminPropertyController.create()), 'admin' means send neither field at all.
export function hostAssignmentToCreateFields(selection: HostAssignmentSelection): Partial<CreatePropertyRequest> {
  switch (selection.mode) {
    case 'existing':
      return { userId: selection.userId };
    case 'new':
      return {
        name: selection.name,
        nationalId: selection.nationalId,
        phoneNumber: selection.phoneNumber,
        email: selection.email,
        residentialAddress: selection.residentialAddress,
        ...(selection.password ? { password: selection.password } : {}),
      };
    case 'admin':
      return {};
  }
}

// Same selection shape, but for PATCH .../assign-host — ReassignHostModal
// never offers the 'admin' tab (no backend operation to un-assign a host),
// so that case can't reach here.
export function hostAssignmentToAssignHostRequest(
  selection: Exclude<HostAssignmentSelection, { mode: 'admin' }>,
): AssignHostRequest {
  switch (selection.mode) {
    case 'existing':
      return { hostId: selection.userId };
    case 'new':
      return {
        name: selection.name,
        nationalId: selection.nationalId,
        phoneNumber: selection.phoneNumber,
        email: selection.email,
        residentialAddress: selection.residentialAddress,
        ...(selection.password ? { password: selection.password } : {}),
      };
  }
}
