import { Property, Banner, Category, EliteHost, Booking } from './types';

export const INITIAL_PROPERTIES: Property[] = [
  { id: '1', name: 'Luxury Burj View Apartment', city: 'Dubai', type: 'City', rating: 4.98, reviews: 124, price: 1250, beds: 2, baths: 2, image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', active: true, hostId: 'm1', hostName: 'Ahmed Al Mansouri', isFeatured: true, status: 'Approved' },
  { id: '2', name: 'Palm Jumeirah Garden Villa', city: 'Dubai', type: 'Beach', rating: 4.92, reviews: 45, price: 2800, beds: 4, baths: 4, image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80', active: true, hostId: 'm1', hostName: 'Ahmed Al Mansouri', isFeatured: false, status: 'Approved' },
  { id: '3', name: 'Saadiyat Island Retreat', city: 'Abu Dhabi', type: 'Beach', rating: 5.0, reviews: 88, price: 1800, beds: 3, baths: 3.5, image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80', active: true, hostId: 'm2', hostName: 'Sarah Wilson', isFeatured: true, status: 'Approved' },
  { id: '4', name: 'Desert Moon Glamping', city: 'Dubai', type: 'Desert', rating: 4.85, reviews: 210, price: 950, beds: 1, baths: 1, image: '/asets/AdobeStock_46380625.webp', active: true, hostId: 'm1', hostName: 'Ahmed Al Mansouri', isFeatured: false, status: 'Approved' },
  { id: '5', name: 'Jebel Jais Peak Villa', city: 'RAK', type: 'Mountain', rating: 4.95, reviews: 18, price: 2100, beds: 3, baths: 3, image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', active: false, hostId: 'm2', hostName: 'Sarah Wilson', isFeatured: false, status: 'Pending' },
  { id: '6', name: 'Modern Marina Duplex', city: 'Dubai', type: 'City', rating: 4.82, reviews: 145, price: 1100, beds: 2, baths: 2.5, image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&q=80', active: true, hostId: 'm1', hostName: 'Ahmed Al Mansouri', isFeatured: true, status: 'Approved' },
  { id: '7', name: 'Al Ain Oasis House', city: 'Dubai', type: 'Desert', rating: 4.0, reviews: 0, price: 800, beds: 2, baths: 1, image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80', active: false, hostId: 'm3', hostName: 'James Chen', isFeatured: false, status: 'Rejected', rejectionReason: 'Incomplete property specifications' },
  { id: '8', name: 'Downtown Loft Request', city: 'Dubai', type: 'City', rating: 0, reviews: 0, price: 900, beds: 1, baths: 1, image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80', active: false, hostId: 'm2', hostName: 'Sarah Wilson', isFeatured: false, status: 'Pending' },
  { id: '9', name: 'Skyline View Studio', city: 'Dubai', type: 'City', rating: 0, reviews: 0, price: 750, beds: 1, baths: 1, image: 'asets/long-festive-table-stands-pier-by-sea.jpg', active: false, hostId: 'm1', hostName: 'Ahmed Al Mansouri', isFeatured: false, status: 'Pending' },
  { id: '10', name: 'Waterside Promenade Apt', city: 'Dubai', type: 'Beach', rating: 0, reviews: 0, price: 1150, beds: 2, baths: 2, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80', active: false, hostId: 'm2', hostName: 'Sarah Wilson', isFeatured: false, status: 'Pending' },
  { id: '11', name: 'Al Marjan Island Suite', city: 'RAK', type: 'Beach', rating: 0, reviews: 0, price: 850, beds: 1, baths: 1, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', active: false, hostId: 'm3', hostName: 'James Chen', isFeatured: false, status: 'Pending' },
  { id: '12', name: 'Royal Heritage Villa', city: 'Abu Dhabi', type: 'Beach', rating: 0, reviews: 0, price: 3500, beds: 5, baths: 6, image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80', active: false, hostId: 'm1', hostName: 'Ahmed Al Mansouri', isFeatured: true, status: 'Pending' },
  { id: '13', name: 'The Cove Waterfront Unit', city: 'Dubai', type: 'Beach', rating: 0, reviews: 0, price: 1300, beds: 2, baths: 2, image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80', active: false, hostId: 'm2', hostName: 'Sarah Wilson', isFeatured: false, status: 'Pending' },
  { id: '14', name: 'Burj Khalifa Row Residence', city: 'Dubai', type: 'City', rating: 0, reviews: 0, price: 2100, beds: 3, baths: 3, image: 'https://images.unsplash.com/photo-1512915922686-57c11f9ad6b3?w=800&q=80', active: false, hostId: 'm1', hostName: 'Ahmed Al Mansouri', isFeatured: false, status: 'Pending' },
];

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
