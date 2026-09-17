import { ACTIVITY_CATEGORIES } from '../../data/activityCategories';
import type { ActivityAddon, ActivityExperience } from '../../types';
import type { ApiExperienceListItem } from './types';

export interface ExperienceRow extends ActivityExperience {
  propertyId: string;
  propertyName: string;
  propertyCity: string;
  propertyImage: string;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80';

function formatDuration(hours: number): string {
  if (!hours) return '—';
  return hours === 1 ? '1 Hour' : `${hours} Hours`;
}

// categoryName/categoryEmoji are only optional on the wire (UNCONFIRMED —
// see types.ts) — fall back to the local catalog so a row never renders a
// blank category label just because the backend only sent categoryId.
export function apiExperienceToViewModel(item: ApiExperienceListItem): ExperienceRow {
  const catalogCategory = ACTIVITY_CATEGORIES.find((c) => c.id === item.categoryId);
  const addons: ActivityAddon[] = (item.addOns || []).map((a, idx) => ({
    id: a._id || `${item._id}-addon-${idx}`,
    title: a.title,
    titleAr: a.titleAr,
    price: a.price,
    priceType: a.pricingModel,
    description: a.description,
  }));

  return {
    id: item._id,
    propertyId: item.propertyId,
    propertyName: item.property?.title || 'Unassigned Property',
    propertyCity: item.property?.city || '—',
    propertyImage: item.property?.images?.[0]?.fullUrl || item.coverPhoto || FALLBACK_IMAGE,
    hostId: item.hostId || '',
    title: item.title,
    titleAr: item.titleAr,
    categoryId: item.categoryId,
    categoryName: item.categoryName || catalogCategory?.nameEn || 'Uncategorized',
    categoryNameAr: item.categoryNameAr || catalogCategory?.nameAr,
    categoryEmoji: item.categoryEmoji || catalogCategory?.emoji || '✨',
    description: item.description,
    images: item.images?.length ? item.images : [item.coverPhoto || FALLBACK_IMAGE],
    price: item.price,
    priceType: item.priceType,
    // Backend stores duration in numeric hours — formatted here for the
    // display-oriented ActivityExperience view-model.
    duration: formatDuration(item.duration),
    minGuests: item.minGuests,
    maxGuests: item.maxGuests,
    // No separate status enum is confirmed on the wire — only `isActive`
    // (see CreateExperienceRequest in types.ts) — so Draft/Sold Out aren't
    // representable yet; anything not explicitly inactive shows as Active.
    status: item.isActive === false ? 'Paused' : 'Active',
    availabilityType: 'Instant',
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    timeSlots: item.timeSlots || [],
    locationType: 'on_site',
    locationDetails: '',
    included: item.inclusions || [],
    whatToBring: item.whatToBring || [],
    addons,
    bookingsCount: item.bookingsCount || 0,
    rating: item.rating || 5,
    reviewsCount: item.reviewsCount || 0,
  };
}
