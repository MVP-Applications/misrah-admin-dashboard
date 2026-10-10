import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
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
  Smartphone,
  Loader2,
  TriangleAlert,
  ChevronLeft,
  Minus,
  Plus
} from 'lucide-react';
import { Property, PriceType } from '../../types';
import { listAllExperiences, listExperienceCategories } from '../../features/experiences/api';
import { apiExperienceToViewModel } from '../../features/experiences/mappers';
import type { ApiExperienceCategory } from '../../features/experiences/types';
import type { ExperienceRow } from '../../features/experiences/mappers';

const PAGE_SIZE = 12;

interface ExploreExperiencesViewProps {
  onOpenMobilePreview?: (propertyId?: string, activityId?: string) => void;
}

export const ExploreExperiencesView = ({
  onOpenMobilePreview
}: ExploreExperiencesViewProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Live catalog — GET /experience/all?page&limit&search&categoryId, shared by admin & host.
  type ExploreExperience = ExperienceRow & { property: Property };
  const [experiences, setExperiences] = useState<ExploreExperience[]>([]);
  const [categories, setCategories] = useState<ApiExperienceCategory[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => { setPage(1); }, [debouncedSearch, selectedCategory]);

  useEffect(() => {
    listExperienceCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    listAllExperiences({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch || undefined,
      categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
    })
      .then(res => {
        if (cancelled) return;
        setExperiences(res.data.map(item => {
          const row = apiExperienceToViewModel(item);
          // Cards show "at {property} ({city})" — build a property from the row.
          const property = { id: row.propertyId, name: row.propertyName, city: row.propertyCity, image: row.propertyImage } as Property;
          return { ...row, property };
        }));
        setTotalPages(res.meta.totalPages || 1);
        setTotalCount(res.meta.total || res.data.length);
      })
      .catch(err => {
        if (cancelled) return;
        setExperiences([]);
        setLoadError(err instanceof Error ? err.message : 'Failed to load experiences.');
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [page, debouncedSearch, selectedCategory]);

  const filteredExperiences = experiences;

  const priceTypeLabels: Record<PriceType, { en: string; ar: string }> = {
    per_person: { en: '/ person', ar: 'لكل شخص' },
    per_group: { en: '/ group', ar: 'لكل مجموعة' },
    hourly: { en: '/ hour', ar: 'بالساعة' },
    fixed: { en: 'total', ar: 'شامل' }
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
          All Categories{selectedCategory === 'all' && !isLoading ? ` (${totalCount})` : ''}
        </button>

        {/* GET /experience-categories — ids match /experience/all's categoryId. */}
        {categories.map(cat => {
          const label = typeof cat.name === 'string' ? cat.name : cat.name?.en || cat.name?.ar || 'Unnamed';
          return (
            <button
              key={cat._id}
              type="button"
              onClick={() => setSelectedCategory(cat._id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2
                ${selectedCategory === cat._id 
                  ? 'bg-primary text-accent shadow-md' 
                  : 'bg-white border border-border-misrah text-muted-text hover:text-primary'}`}
            >
              {cat.iconName && /\p{Extended_Pictographic}/u.test(cat.iconName) && <span>{cat.iconName}</span>}
              <span>{label}</span>
              {selectedCategory === cat._id && !isLoading && <span className="opacity-60 text-[10px]">({totalCount})</span>}
            </button>
          );
        })}
      </div>

      {/* Experiences Grid */}
      {isLoading ? (
        <div className="p-24 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary/30" />
        </div>
      ) : loadError ? (
        <div className="p-16 bg-danger/5 rounded-[36px] border border-danger/20 text-center space-y-3">
          <TriangleAlert size={32} className="mx-auto text-danger" />
          <p className="text-xs font-bold text-danger">{loadError}</p>
        </div>
      ) : filteredExperiences.length === 0 ? (
        <div className="p-16 bg-white rounded-[36px] border border-dashed border-border-misrah text-center space-y-3">
          <Sparkles size={32} className="mx-auto text-accent" />
          <h3 className="text-lg font-black text-primary uppercase">
            {debouncedSearch ? `No experiences match "${debouncedSearch}"` : 'No experiences found'}
          </h3>
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

                {/* Price */}
                <div className="pt-4 border-t border-border-misrah/60 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-muted-text block">Experience Price</span>
                    <span className="text-xl font-black italic text-primary">
                      {exp.currency} {exp.price.toLocaleString()}
                      <span className="text-[10px] font-normal text-muted-text ml-1">
                        {priceTypeLabels[exp.priceType]?.en}
                      </span>
                    </span>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !loadError && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="w-10 h-10 rounded-xl bg-white border border-border-misrah flex items-center justify-center text-primary disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">Page {page} of {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="w-10 h-10 rounded-xl bg-white border border-border-misrah flex items-center justify-center text-primary disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

    </motion.div>
  );
};
