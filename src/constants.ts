import { Banner, Category, EliteHost, Booking } from './types';

export const INITIAL_BANNERS: Banner[] = [
  { id: 'bn1', title: 'Summer in the Dunes', image: '/asets/beach-dubai.jpg', link: '/promo/summer', active: true },
  { id: 'bn2', title: 'Elite Beach Escapes', image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80', link: '/promo/beach', active: true },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'c1', name: 'City', image: '/asets/images.jpg', count: 12 },
  { id: 'c2', name: 'Beach', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400', count: 8 },
  { id: 'c3', name: 'Desert', image: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=400', count: 5 },
];

export const INITIAL_ELITE_HOSTS: EliteHost[] = [
  { id: 'm1', name: 'Ahmed Al Mansouri', avatar: 'https://i.pravatar.cc/150?u=ahmed', properties: 4, rating: 4.95, isElite: true, suspended: false },
  { id: 'm2', name: 'Sarah Wilson', avatar: 'https://i.pravatar.cc/150?u=sarah', properties: 2, rating: 4.88, isElite: true, suspended: false },
  { id: 'm3', name: 'James Chen', avatar: 'https://i.pravatar.cc/150?u=james', properties: 1, rating: 4.2, isElite: false, suspended: true },
];

export const BOOKINGS: Booking[] = [
  { id: 'b1', guestName: 'Zayed Al Mansouri', guestAvatar: 'https://i.pravatar.cc/150?u=zayed', propertyName: 'Luxury Burj View Apt.', checkIn: 'Jan 12, 2026', checkOut: 'Jan 15, 2026', guests: 2, total: 3750, status: 'Hosting' },
  { id: 'b2', guestName: 'Fatima Rashid', guestAvatar: 'https://i.pravatar.cc/150?u=fatima2', propertyName: 'Luxury Burj View Apt.', checkIn: 'Jan 15, 2026', checkOut: 'Jan 18, 2026', guests: 2, total: 3750, status: 'Arriving Soon' },
  { id: 'b3', guestName: 'Omar Khalid', guestAvatar: 'https://i.pravatar.cc/150?u=omar2', propertyName: 'Saadiyat Island Retreat', checkIn: 'Jan 14, 2026', checkOut: 'Jan 17, 2026', guests: 4, total: 5400, status: 'Confirmed' },
  { id: 'b4', guestName: 'Sarah Jenkins', guestAvatar: 'https://i.pravatar.cc/150?u=sarah2', propertyName: 'Modern Marina Duplex', checkIn: 'Dec 28, 2025', checkOut: 'Jan 2, 2026', guests: 1, total: 5500, status: 'Past' },
];
