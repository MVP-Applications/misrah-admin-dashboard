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
// Plain text from a value that may be a string, a localized { en, ar }
// object, or a populated document with a name.
const asText = (v: unknown, fallback = ''): string => {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.en === 'string') return o.en;
    if (o.name !== undefined) return asText(o.name, fallback);
    if (typeof o.title === 'string') return o.title;
  }
  return fallback;
};

const asNumber = (v: unknown, fallback = 0): number => {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
};

export function apiPropertyToViewModel(doc: ApiPropertyListItem): Property {
  // Defensive: list items have been seen with populated / localized fields,
  // and a missing pricing block must not crash the whole page.
  const raw = doc as unknown as Record<string, any>;
  return {
    id: doc._id,
    name: asText(doc.title, 'Untitled property'),
    city: asText(doc.city?.name ?? raw.cityId, 'Unknown'),
    type: asText(doc.propertyType),
    rating: doc.avgRating ?? 0,
    load: doc.load === null || doc.load === undefined || doc.load === '' || !Number.isFinite(Number(doc.load)) ? null : Number(doc.load),
    reviews: doc.reviewCount ?? 0,
    price: asNumber(doc.pricing?.basePrice),
    currency: doc.pricing?.currency ? asText(doc.pricing.currency).toUpperCase() : undefined,
    beds: asNumber(doc.beds),
    baths: asNumber(doc.bathrooms),
    image: doc.images?.[0]?.fullUrl ?? FALLBACK_IMAGE_URL,
    active: doc.isActive ?? true,
    hostId: doc.owner?._id ?? doc.userId,
    hostName: doc.owner?.name !== undefined ? asText(doc.owner.name) : undefined,
    description: asText(doc.description),
    isFeatured: false,
    // Case-insensitive — tolerate PENDING/APPROVED/REJECTED as well.
    status: STATUS_TO_VIEW_MODEL[String(doc.status ?? '').toLowerCase() as ApiPropertyListItem['status']],
    rejectionReason: doc.rejectionReason !== undefined && doc.rejectionReason !== null ? asText(doc.rejectionReason) : undefined,
    // ISO "2026-10-09T00:00:00.000Z" → "2026-10-09" (the UTC calendar day).
    availableForever: raw.availableForever === undefined ? undefined : raw.availableForever !== false,
    availabilityStart: typeof raw.startDate === 'string' ? raw.startDate.slice(0, 10) : null,
    availabilityEnd: typeof raw.endDate === 'string' ? raw.endDate.slice(0, 10) : null,
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
    // The edited price is in the currency the property was shown in (the API
    // converts to the user's preferred currency) — send it so it's stored right.
    payload.pricing = {
      basePrice: updates.price,
      weekdayPrice: updates.price,
      weekendPrice: updates.price,
      ...(updates.currency ? { currency: updates.currency } : {}),
    };
  }
  // Availability: "YYYY-MM-DD" → start / end of that UTC day. endDate is not
  // sent when availableForever is true (per the API).
  if (updates.availableForever !== undefined) payload.availableForever = updates.availableForever;
  if (updates.availabilityStart) payload.startDate = `${updates.availabilityStart}T00:00:00.000Z`;
  if (updates.availableForever === false && updates.availabilityEnd) {
    payload.endDate = `${updates.availabilityEnd}T23:59:59.999Z`;
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
