import { ReactNode } from 'react';

export type UserRole = 'admin' | 'manager';

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
  hostId: string;
  hostName?: string;
  description?: string;
  isFeatured: boolean;
  status?: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
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

export interface Booking {
  id: string;
  guestName: string;
  guestAvatar: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  // 'Pending' added after checking the real backend schema (a raw booking
  // status value with no dedicated query-filter enum entry server-side, but
  // real and reachable). 'Arriving Soon' is never derived from real data —
  // the backend has no concept of it separate from 'Confirmed' without an
  // arbitrary client-side day threshold — kept in the union only so existing
  // Badge styling code doesn't need to change.
  status: 'Hosting' | 'Arriving Soon' | 'Confirmed' | 'Pending' | 'Past' | 'Cancelled';
}
