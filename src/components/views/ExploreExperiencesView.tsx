import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Search, 
  Clock, 
  Users, 
  MapPin, 
  Star, 
  Building2, 
  Check, 
  X, 
  DollarSign, 
  Calendar,
  Share2,
  ChevronRight,
  Utensils,
  Waves,
  Compass,
  HeartPulse,
  Palette,
  Crown,
  Leaf,
  Camera,
  Smartphone
} from 'lucide-react';
import { Property, ActivityExperience, PriceType, Booking } from '../../types';
import { ACTIVITY_CATEGORIES, CategoryDefinition } from '../../data/activityCategories';
import { Badge } from '../ui/Badge';

interface ExploreExperiencesViewProps {
  properties: Property[];
  onOpenMobilePreview?: (propertyId?: string, activityId?: string) => void;
  onAddBooking?: (booking: Booking) => void;
}

export const ExploreExperiencesView = ({
  properties,
  onOpenMobilePreview,
  onAddBooking
}: ExploreExperiencesViewProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedActivity, setSelectedActivity] = useState<ActivityExperience | null>(null);
  const [activePropertyForBooking, setActivePropertyForBooking] = useState<Property | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingDate, setBookingDate] = useState('2026-09-20');
  const [bookingSlot, setBookingSlot] = useState('Evening (19:00 - 21:00)');
  const [bookingGuests, setBookingGuests] = useState(4);

  // Flatten all active experiences
  const allExperiences = properties.flatMap(p => 
    (p.activities || []).filter(a => a.status === 'Active').map(a => ({
      ...a,
      property: p
    }))
  );

  const filteredExperiences = allExperiences.filter(exp => {
    if (selectedCategory !== 'all' && exp.categoryId !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = exp.title.toLowerCase().includes(q) || (exp.titleAr && exp.titleAr.includes(q));
      const matchCat = exp.categoryName.toLowerCase().includes(q);
      const matchProp = exp.property.name.toLowerCase().includes(q) || exp.property.city.toLowerCase().includes(q);
      if (!matchTitle && !matchCat && !matchProp) return false;
    }
    return true;
  });

  const priceTypeLabels: Record<PriceType, { en: string; ar: string }> = {
    per_person: { en: '/ person', ar: 'لكل شخص' },
    per_group: { en: '/ group', ar: 'لكل مجموعة' },
    hourly: { en: '/ hour', ar: 'بالساعة' },
    fixed: { en: 'total', ar: 'شامل' }
  };

  const handleBookExperience = (activity: ActivityExperience & { property: Property }) => {
    setSelectedActivity(activity);
    setActivePropertyForBooking(activity.property);
    const slots = (activity.timeSlots && activity.timeSlots.length > 0)
      ? activity.timeSlots
      : ['10:00 - 12:00', '16:00 - 18:00', '19:00 - 21:00'];
    setBookingSlot(slots[0]);
    setIsBookingModalOpen(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
      id="explore-experiences-view"
    >
      {/* Hero Header */}
      <div className="bg-primary text-white rounded-[40px] p-8 md:p-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-wider">
            <Sparkles size={12} />
            UAE Curated Retreat Experiences
          </div>

          <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight leading-tight">
            Activities & <span className="text-accent">Experiences</span>
          </h1>

          <p className="text-white/70 text-sm font-medium leading-relaxed">
            Elevate your stay at premier UAE retreats with private chefs, yacht excursions, stargazing, padel clinics, falconry and equestrian tours.
          </p>

          {/* Search Bar */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" />
              <input 
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search private chef, yacht, falconry, yoga, desert safari..."
                className="w-full pl-11 pr-4 py-3.5 bg-white text-primary rounded-2xl text-xs font-bold outline-none shadow-lg placeholder:text-muted-text"
              />
            </div>
            {onOpenMobilePreview && (
              <button
                type="button"
                onClick={() => onOpenMobilePreview()}
                className="px-6 py-3.5 rounded-2xl bg-accent text-primary text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 shrink-0 hover:scale-105 transition-all"
              >
                <Smartphone size={16} />
                Mobile App View
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 9 Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2
            ${selectedCategory === 'all' 
              ? 'bg-primary text-accent shadow-md' 
              : 'bg-white border border-border-misrah text-muted-text hover:text-primary'}`}
        >
          <Sparkles size={14} />
          All Categories ({allExperiences.length})
        </button>

        {ACTIVITY_CATEGORIES.map(cat => {
          const count = allExperiences.filter(e => e.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2
                ${selectedCategory === cat.id 
                  ? 'bg-primary text-accent shadow-md' 
                  : 'bg-white border border-border-misrah text-muted-text hover:text-primary'}`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.nameEn}</span>
              <span className="opacity-60 text-[10px]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Experiences Grid */}
      {filteredExperiences.length === 0 ? (
        <div className="p-16 bg-white rounded-[36px] border border-dashed border-border-misrah text-center space-y-3">
          <Sparkles size={32} className="mx-auto text-accent" />
          <h3 className="text-lg font-black text-primary uppercase">No experiences match "{searchQuery}"</h3>
          <p className="text-xs text-muted-text">Try searching for other keywords or select another category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperiences.map(exp => (
            <div 
              key={exp.id}
              className="bg-white rounded-[36px] border border-border-misrah overflow-hidden shadow-xs hover:shadow-luxury hover:border-accent/50 transition-all flex flex-col group"
            >
              {/* Photo & Category Badge */}
              <div className="h-52 relative overflow-hidden bg-surface">
                <img 
                  src={exp.images?.[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80'} 
                  alt={exp.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-linear-to-t from-primary/80 via-transparent to-transparent" />

                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-white/95 backdrop-blur-md text-primary text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <span>{exp.categoryEmoji}</span>
                    <span>{exp.categoryName}</span>
                  </span>
                </div>

                <div className="absolute top-4 right-4 px-2.5 py-1 rounded-xl bg-accent text-primary text-[10px] font-black shadow-sm flex items-center gap-1">
                  <Star size={12} fill="currentColor" />
                  <span>5.0</span>
                </div>

                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <div className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-1 mb-0.5">
                    <Building2 size={11} /> {exp.property.name} ({exp.property.city})
                  </div>
                  <h3 className="text-base font-black italic uppercase leading-tight truncate">{exp.title}</h3>
                  <p className="text-xs text-white/80 font-bold truncate">{exp.titleAr}</p>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-muted-text font-bold">
                    <span className="flex items-center gap-1.5"><Clock size={13} /> {exp.duration}</span>
                    <span className="flex items-center gap-1.5"><Users size={13} /> Up to {exp.maxGuests} Guests</span>
                  </div>

                  <p className="text-[11px] text-muted-text leading-relaxed line-clamp-2">
                    {exp.description}
                  </p>

                  {exp.included && exp.included.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {exp.included.slice(0, 2).map((inc, i) => (
                        <span key={i} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-surface text-primary/80 border border-border-misrah/60">
                          ✓ {inc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price & CTA */}
                <div className="pt-4 border-t border-border-misrah/60 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-muted-text block">Experience Price</span>
                    <span className="text-xl font-black italic text-primary">
                      AED {exp.price.toLocaleString()}
                      <span className="text-[10px] font-normal text-muted-text ml-1">
                        {priceTypeLabels[exp.priceType]?.en}
                      </span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleBookExperience(exp)}
                    className="px-5 py-2.5 rounded-2xl bg-primary text-accent hover:opacity-90 text-xs font-black uppercase tracking-wider shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <span>Reserve</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instant Experience Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && selectedActivity && activePropertyForBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] w-full max-w-lg p-8 relative z-10 shadow-luxury space-y-6 max-h-[85vh] overflow-y-auto"
            >
              {!bookingSuccess ? (
                <>
                  <div className="flex items-center justify-between pb-4 border-b border-border-misrah">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-accent">Instant Experience Reservation</span>
                      <h3 className="text-xl font-black italic text-primary uppercase mt-0.5">{selectedActivity.title}</h3>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setIsBookingModalOpen(false)}
                      className="w-8 h-8 rounded-full bg-surface hover:bg-border-misrah flex items-center justify-center text-primary"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-surface rounded-2xl border border-border-misrah flex items-center gap-4">
                      <img 
                        src={selectedActivity.images?.[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80'} 
                        alt={selectedActivity.title} 
                        className="w-16 h-16 rounded-xl object-cover shrink-0"
                      />
                      <div>
                        <span className="text-[10px] font-black text-accent uppercase">{selectedActivity.categoryName}</span>
                        <h4 className="text-sm font-black text-primary">{selectedActivity.title}</h4>
                        <p className="text-[11px] text-muted-text">At {activePropertyForBooking.name} ({activePropertyForBooking.city})</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-surface rounded-xl border border-border-misrah">
                        <span className="text-[9px] font-black uppercase text-muted-text block mb-1">Duration</span>
                        <span className="font-bold text-primary">{selectedActivity.duration}</span>
                      </div>
                      <div className="p-3 bg-surface rounded-xl border border-border-misrah">
                        <span className="text-[9px] font-black uppercase text-muted-text block mb-1">Price Rate</span>
                        <span className="font-black text-accent">AED {selectedActivity.price} {priceTypeLabels[selectedActivity.priceType]?.en}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block">Preferred Date & Time</label>
                      <div className="grid grid-cols-2 gap-3">
                        <input 
                          type="date" 
                          value={bookingDate} 
                          onChange={e => setBookingDate(e.target.value)}
                          className="p-3 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent" 
                        />
                        <select 
                          value={bookingSlot}
                          onChange={e => setBookingSlot(e.target.value)}
                          className="p-3 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                        >
                          {((selectedActivity.timeSlots && selectedActivity.timeSlots.length > 0)
                            ? selectedActivity.timeSlots
                            : ['10:00 - 12:00', '16:00 - 18:00', '19:00 - 21:00']).map(slot => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-muted-text font-bold">Total Estimated:</span>
                        <p className="text-lg font-black italic text-primary">AED {selectedActivity.price.toLocaleString()}</p>
                      </div>
                      <Badge variant="green">Instant Confirmation</Badge>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsBookingModalOpen(false)}
                      className="flex-1 py-3.5 rounded-2xl border border-border-misrah text-xs font-black uppercase tracking-wider text-primary hover:bg-surface"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onAddBooking && activePropertyForBooking && selectedActivity) {
                          const newExpBooking: Booking = {
                            id: `b-exp-${Date.now()}`,
                            guestName: 'Zayed Al Qasimi',
                            guestAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
                            guestPhone: '+971 50 888 1234',
                            guestEmail: 'zayed@masara.ae',
                            propertyName: activePropertyForBooking.name,
                            propertyId: activePropertyForBooking.id,
                            location: activePropertyForBooking.city,
                            checkIn: bookingDate,
                            checkOut: bookingDate,
                            date: bookingDate,
                            time: bookingSlot || (selectedActivity.timeSlots?.[0] || '10:00 - 12:00'),
                            duration: selectedActivity.duration,
                            guests: bookingGuests,
                            total: selectedActivity.price,
                            hostEarnings: Math.round(selectedActivity.price * 0.9),
                            paymentStatus: 'Paid',
                            status: 'Confirmed',
                            bookingType: 'Experience',
                            experienceName: selectedActivity.title,
                            experienceImage: selectedActivity.images?.[0],
                            experienceCategory: selectedActivity.categoryName,
                            experienceEmoji: selectedActivity.categoryEmoji,
                            specialRequests: 'Reserved via Masara Host Platform'
                          };
                          onAddBooking(newExpBooking);
                        }
                        setBookingSuccess(true);
                      }}
                      className="flex-[2] py-3.5 bg-primary text-accent rounded-2xl text-xs font-black uppercase tracking-wider hover:opacity-95 shadow-md"
                    >
                      Confirm Booking
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                    <Check size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black italic text-primary uppercase">Experience Confirmed!</h3>
                    <p className="text-xs text-muted-text max-w-sm mx-auto mt-1">
                      Your booking for <b>{selectedActivity.title}</b> at {activePropertyForBooking.name} has been synchronized and sent to the host.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingSuccess(false);
                      setIsBookingModalOpen(false);
                    }}
                    className="px-8 py-3.5 bg-primary text-accent rounded-2xl text-xs font-black uppercase tracking-wider shadow-md"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
