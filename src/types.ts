import { ReactNode } from 'react';

export type UserRole = 'admin' | 'manager';

export type PriceType = 'per_person' | 'per_group' | 'hourly' | 'fixed';
export type ActivityStatus = 'Active' | 'Draft' | 'Paused' | 'Sold Out';
export type ActivityLocationType = 'on_site' | 'nearby' | 'departure_point';

export interface ActivityAddon {
  id: string;
  title: string;
  titleAr?: string;
  price: number;
  priceType?: 'fixed' | 'per_person' | 'hourly';
  description?: string;
}

export interface ActivityExperience {
  id: string;
  propertyId: string;
  propertyName?: string;
  hostId: string;
  hostName?: string;
  hostAvatar?: string;
  title: string;
  titleAr?: string;
  categoryId: string;
  categoryName: string;
  categoryNameAr?: string;
  categoryEmoji?: string;
  description: string;
  images: string[];
  price: number;
  priceType: PriceType;
  duration: string;
  minGuests: number;
  maxGuests: number;
  status: ActivityStatus;
  availabilityType: 'Instant' | 'On Request';
  availableDays: string[];
  timeSlots: string[];
  locationType: ActivityLocationType;
  locationDetails: string;
  included: string[];
  whatToBring: string[];
  ageRequirement?: string;
  addons?: ActivityAddon[];
  specialFields?: {
    departureLocation?: string;
    photosDelivered?: number;
    deliveryTime?: string;
    dietaryOptions?: string[];
    equipmentProvided?: string[];
    courtType?: string;
    notes?: string;
  };
  bookingsCount: number;
  rating: number;
  reviewsCount: number;
  featured?: boolean;
  orderIndex?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  verificationStatus?: 'Unverified' | 'Pending' | 'Approved' | 'Rejected';
  verificationData?: {
    emiratesId?: string;
    phone?: string;
    propertyDoc?: string;
    tradeLicense?: string;
  };
  rejectionReason?: string;
}

export interface Property {
  id: string;
  name: string;
  city: string;
  type: string;
  rating: number;
  reviews: number;
  price: number;
  beds: number;
  baths: number;
  image: string;
  active: boolean;
  // Optional — a property onboarded via the "Admin" (unassigned) path has no
  // host at all. See PropertyDetailView's Partner Node card for how this
  // renders ("Managed by Admin" instead of a host profile).
  hostId?: string;
  hostName?: string;
  description?: string;
  isFeatured: boolean;
  status?: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  activities?: ActivityExperience[];
}

export interface Banner {
  id: string;
  title: string;
  image: string;
  link: string;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  count: number;
}

export interface EliteHost {
  id: string;
  name: string;
  avatar: string;
  properties: number;
  rating: number;
  isElite: boolean;
  suspended?: boolean;
}

export interface BookedExperienceItem {
  activityId: string;
  title: string;
  price: number;
  priceType: PriceType;
  quantity: number;
  date?: string;
  timeSlot?: string;
}

export interface Booking {
  id: string;
  guestName: string;
  guestAvatar: string;
  guestPhone?: string;
  guestEmail?: string;
  propertyName: string;
  propertyId?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  // 'Pending' added after checking the real backend schema (a raw booking
  // status value with no dedicated query-filter enum entry server-side, but
  // real and reachable). 'Arriving Soon' is never derived from real data —
  // the backend has no concept of it separate from 'Confirmed' without an
  // arbitrary client-side day threshold — kept in the union only so existing
  // Badge styling code doesn't need to change. 'Completed' comes from the
  // ported Experiences feature (misrah-retreats-admin), which distinguishes
  // finished experience bookings from finished property stays ('Past').
  status: 'Hosting' | 'Arriving Soon' | 'Confirmed' | 'Pending' | 'Past' | 'Cancelled' | 'Completed';
  bookingType?: 'Property' | 'Experience' | 'Combined';

  // Experience-specific fields (ported alongside the Experiences feature)
  experienceName?: string;
  experienceImage?: string;
  experienceCategory?: string;
  experienceEmoji?: string;
  activityId?: string;
  date?: string;
  time?: string;
  duration?: string;
  location?: string;
  paymentStatus?: 'Paid' | 'Pending' | 'Refunded';
  specialRequests?: string;
  hostEarnings?: number;

  selectedExperiences?: BookedExperienceItem[];
  experienceTotal?: number;
  selectedAddons?: ActivityAddon[];
  addonsTotal?: number;
}
