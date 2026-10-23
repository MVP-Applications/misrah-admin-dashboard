import type { Property } from '../../types';
import type { ApiPropertyListItem, AssignHostRequest, CreatePropertyRequest, HostAssignmentSelection, UpdatePropertyRequest } from './types';


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
    // '' when the property has no images — views show a "No image"
    // placeholder rather than a stock photo.
    image: doc.images?.[0]?.fullUrl ?? '',
    active: doc.isActive ?? true,
    hostId: doc.owner?._id ?? doc.userId,
    hostName: doc.owner?.name !== undefined ? asText(doc.owner.name) : undefined,
    hostEmail: doc.owner?.email || undefined,
    hostPhone: doc.owner?.phoneNumber || undefined,
    description: asText(doc.description),
    isFeatured: false,
    // Case-insensitive — tolerate PENDING/APPROVED/REJECTED as well.
    status: STATUS_TO_VIEW_MODEL[String(doc.status ?? '').toLowerCase() as ApiPropertyListItem['status']],
    rejectionReason: doc.rejectionReason !== undefined && doc.rejectionReason !== null ? asText(doc.rejectionReason) : undefined,
    // ISO "2026-10-09T00:00:00.000Z" → "2026-10-09" (the UTC calendar day).
    availableForever: raw.availableForever === undefined ? undefined : raw.availableForever !== false,
    availabilityStart: typeof raw.startDate === 'string' ? raw.startDate.slice(0, 10) : null,
    availabilityEnd: typeof raw.endDate === 'string' ? raw.endDate.slice(0, 10) : null,
    cityId: typeof raw.cityId === 'string' ? raw.cityId : raw.cityId?._id ?? doc.city?._id,
    propertyType: doc.propertyType ? asText(doc.propertyType).toUpperCase() : undefined,
    address: raw.address !== undefined && raw.address !== null ? asText(raw.address) : undefined,
    bedrooms: raw.bedrooms !== undefined ? asNumber(raw.bedrooms) : undefined,
    maxAdults: raw.maxAdults !== undefined ? asNumber(raw.maxAdults) : undefined,
    maxChildren: raw.maxChildren !== undefined ? asNumber(raw.maxChildren) : undefined,
    weekdayPrice: doc.pricing?.weekdayPrice !== undefined ? asNumber(doc.pricing.weekdayPrice) : undefined,
    weekendPrice: doc.pricing?.weekendPrice !== undefined ? asNumber(doc.pricing.weekendPrice) : undefined,
    amenities: Array.isArray(raw.amenities) ? raw.amenities.map((a: unknown) => asText(a)).filter(Boolean) : [],
    selfCheckIn: raw.selfCheckInAvailable === true,
    selfCheckInInstruction: typeof raw.selfCheckInInstruction === 'string' ? raw.selfCheckInInstruction : undefined,
    latitude: typeof raw.latitude === 'number' ? raw.latitude : undefined,
    longitude: typeof raw.longitude === 'number' ? raw.longitude : undefined,
    // Images come back populated ({ _id, fullUrl }); a bare id has no URL.
    gallery: Array.isArray(raw.images)
      ? raw.images
          .filter((img: any) => img && typeof img === 'object' && img._id && img.fullUrl)
          .map((img: any) => ({ id: String(img._id), url: String(img.fullUrl) }))
      : [],
    // fileId is normally a bare id, but tolerate a populated file document.
    documents: Array.isArray(raw.documents)
      ? raw.documents
          .filter((d: any) => d && d.type)
          .map((d: any, i: number) => {
            const file = d.fileId && typeof d.fileId === 'object' ? d.fileId : null;
            return {
              id: String(d._id ?? `${d.type}-${i}`),
              type: String(d.type),
              fileId: String(file ? file._id ?? '' : d.fileId ?? ''),
              uploadedAt: typeof d.uploadedAt === 'string' ? d.uploadedAt : undefined,
              url: file?.fullUrl ?? file?.url ?? d.fullUrl ?? d.url ?? undefined,
            };
          })
      : [],
  };
}

// Reverse-maps the fields PropertyDetailView's edit form actually sends via
// onUpdate(id, Partial<Property>) (handleSave sends the whole formData) — not
// a full inverse of apiPropertyToViewModel. The display-only `city` name /
// `type` aren't sent; the real cityId / propertyType are.
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
    // Weekday / weekend default to the base price when not set.
    payload.pricing = {
      basePrice: updates.price,
      weekdayPrice: updates.weekdayPrice && updates.weekdayPrice > 0 ? updates.weekdayPrice : updates.price,
      weekendPrice: updates.weekendPrice && updates.weekendPrice > 0 ? updates.weekendPrice : updates.price,
      ...(updates.currency ? { currency: updates.currency } : {}),
    };
  }
  if (updates.cityId) payload.cityId = updates.cityId;
  if (updates.propertyType) payload.propertyType = updates.propertyType as UpdatePropertyRequest['propertyType'];
  if (updates.address !== undefined) payload.address = updates.address;
  if (updates.bedrooms !== undefined) payload.bedrooms = updates.bedrooms;
  if (updates.maxAdults !== undefined) payload.maxAdults = updates.maxAdults;
  if (updates.maxChildren !== undefined) payload.maxChildren = updates.maxChildren;
  if (updates.amenities !== undefined) payload.amenities = updates.amenities;
  if (updates.selfCheckIn !== undefined) payload.selfCheckInAvailable = updates.selfCheckIn;
  if (updates.selfCheckIn && updates.selfCheckInInstruction !== undefined) {
    payload.selfCheckInInstruction = updates.selfCheckInInstruction;
  }
  if (updates.latitude !== undefined && updates.longitude !== undefined) {
    payload.latitude = updates.latitude;
    payload.longitude = updates.longitude;
  }
  // Compliance documents — the full list ({ type, fileId }) replaces the old one.
  if (updates.documents !== undefined) {
    payload.documents = updates.documents.filter(d => d.fileId).map(d => ({ type: d.type, fileId: d.fileId }));
  }
  // Photos — file ids in display order (first = cover).
  if (updates.gallery !== undefined) payload.images = updates.gallery.map(p => p.id);
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
