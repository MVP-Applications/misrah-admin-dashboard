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

// Defensive coercion for fields the UI renders directly. Some records (seen
// on the Approved tab) can carry populated objects where the list normally
// has plain values — e.g. a city/category document or a localized
// { en, ar } name — and rendering an object crashes the whole view.
function toText(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of ['en', 'name', 'title', 'label', 'value']) {
      const inner = obj[key];
      if (typeof inner === 'string') return inner;
      if (inner && typeof inner === 'object' && typeof (inner as Record<string, unknown>).en === 'string') {
        return (inner as Record<string, string>).en;
      }
    }
  }
  return fallback;
}

function toId(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof (value as { _id?: unknown })._id === 'string') {
    return (value as { _id: string })._id;
  }
  return '';
}

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(v => toText(v, '')).filter(Boolean);
}

// Time slots may come back as strings or as { startTime, endTime } objects.
function toTimeSlots(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(v => {
      if (typeof v === 'string') return v;
      if (v && typeof v === 'object') {
        const slot = v as Record<string, unknown>;
        const start = toText(slot.startTime ?? slot.start ?? slot.time, '');
        const end = toText(slot.endTime ?? slot.end, '');
        return end ? `${start} - ${end}` : start;
      }
      return '';
    })
    .filter(Boolean);
}

function formatDuration(hours: number): string {
  if (!hours) return '—';
  return hours === 1 ? '1 Hour' : `${hours} Hours`;
}

// categoryName/categoryEmoji are only optional on the wire (UNCONFIRMED —
// see types.ts) — fall back to the local catalog so a row never renders a
// blank category label just because the backend only sent categoryId.
export function apiExperienceToViewModel(item: ApiExperienceListItem): ExperienceRow {
  const categoryId = toId(item.categoryId);
  const catalogCategory = ACTIVITY_CATEGORIES.find((c) => c.id === categoryId);
  const addons: ActivityAddon[] = (item.addOns || []).map((a, idx) => ({
    id: a._id || `${item._id}-addon-${idx}`,
    title: toText(a.title),
    titleAr: toText(a.titleAr) || undefined,
    price: toNumber(a.price),
    priceType: a.pricingModel,
    description: toText(a.description) || undefined,
  }));

  // This view-model (and most of ExperiencesView's UI — the property
  // filter, edit/delete guards, etc.) still assumes one property per
  // experience row, so only the first of possibly several associated
  // properties is shown here even though the wire shape is plural.
  const primaryProperty = item.properties?.[0];

  return {
    id: item._id,
    propertyId: toId(item.propertyIds?.[0]),
    propertyName: toText(primaryProperty?.title, 'Unassigned Property'),
    propertyCity: toText(primaryProperty?.city, '—'),
    propertyImage: toText(primaryProperty?.images?.[0]?.fullUrl) || toText(item.coverPhoto) || FALLBACK_IMAGE,
    hostId: toId(item.hostId),
    title: toText(item.title, 'Untitled Experience'),
    titleAr: toText(item.titleAr) || undefined,
    categoryId,
    categoryName: toText(item.categoryName) || toText(item.categoryId) || catalogCategory?.nameEn || 'Uncategorized',
    categoryNameAr: toText(item.categoryNameAr) || catalogCategory?.nameAr,
    categoryEmoji: toText(item.categoryEmoji) || catalogCategory?.emoji || '✨',
    description: toText(item.description),
    images: toTextList(item.images).length ? toTextList(item.images) : [toText(item.coverPhoto) || FALLBACK_IMAGE],
    price: toNumber(item.price),
    priceType: item.priceType,
    // Backend stores duration in numeric hours — formatted here for the
    // display-oriented ActivityExperience view-model.
    duration: formatDuration(toNumber(item.duration)),
    minGuests: toNumber(item.minGuests, 1),
    maxGuests: toNumber(item.maxGuests, 1),
    // No separate status enum is confirmed on the wire — only `isActive`
    // (see CreateExperienceRequest in types.ts) — so Draft/Sold Out aren't
    // representable yet; anything not explicitly inactive shows as Active.
    status: item.isActive === false ? 'Paused' : 'Active',
    approvalStatus: toText(item.status) || undefined,
    availabilityType: 'Instant',
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    timeSlots: toTimeSlots(item.timeSlots),
    locationType: 'on_site',
    locationDetails: '',
    included: toTextList(item.inclusions),
    whatToBring: toTextList(item.whatToBring),
    addons,
    bookingsCount: toNumber(item.bookingsCount),
    rating: toNumber(item.rating, 5) || 5,
    reviewsCount: toNumber(item.reviewsCount),
  };
}
