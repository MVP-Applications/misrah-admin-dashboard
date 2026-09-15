import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Plus, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Eye, 
  Edit3, 
  Trash2, 
  Clock, 
  Users, 
  DollarSign, 
  Calendar, 
  Star, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  ChevronRight, 
  ArrowUpRight, 
  Layers,
  TrendingUp,
  X,
  MapPin,
  Check,
  Tag
} from 'lucide-react';
import { Property, User, ActivityExperience, PriceType, ActivityAddon } from '../../types';
import { ACTIVITY_CATEGORIES, CategoryDefinition } from '../../data/activityCategories';
import { getSuggestedAddons, CATEGORY_DEFAULT_ADDONS } from '../../data/activityAddons';
import { STANDARD_TIME_SLOT_PRESETS, getCategoryDefaultTimeSlots } from '../../data/activityTimeSlots';
import { Badge } from '../ui/Badge';

interface ExperiencesViewProps {
  user: User;
  properties: Property[];
  onUpdatePropertyActivities: (propertyId: string, activities: ActivityExperience[]) => void;
}

export const ExperiencesView = ({
  user,
  properties,
  onUpdatePropertyActivities
}: ExperiencesViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<{ propertyId: string; activity: ActivityExperience } | null>(null);
  const [selectedTargetPropertyId, setSelectedTargetPropertyId] = useState<string>(properties[0]?.id || '');
  const [deleteTarget, setDeleteTarget] = useState<{ propertyId: string; activityId: string; title: string; propertyName: string } | null>(null);

  // Add experience modal internal states
  const [addMode, setAddMode] = useState<'preset' | 'custom'>('preset');
  const [modalCategory, setModalCategory] = useState<string>('all');
  const [modalSearch, setModalSearch] = useState<string>('');
  const [customForm, setCustomForm] = useState({
    title: '',
    titleAr: '',
    categoryId: 'culinary',
    description: '',
    price: 250,
    priceType: 'per_person' as PriceType,
    duration: '2 Hours',
    minGuests: 1,
    maxGuests: 10,
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    locationDetails: 'Property grounds & facilities',
    included: 'Equipment, Welcome refreshments',
    whatToBring: 'Comfortable clothing',
    addons: getSuggestedAddons('culinary') as ActivityAddon[],
    timeSlots: getCategoryDefaultTimeSlots('culinary') as string[]
  });

  // Time slot input states
  const [newCustomSlot, setNewCustomSlot] = useState('');
  const [newEditCustomSlot, setNewEditCustomSlot] = useState('');

  // Custom add-on sub-form states
  const [isAddingNewAddon, setIsAddingNewAddon] = useState(false);
  const [newAddonTitle, setNewAddonTitle] = useState('');
  const [newAddonTitleAr, setNewAddonTitleAr] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState<number>(100);
  const [newAddonPriceType, setNewAddonPriceType] = useState<PriceType>('fixed');
  const [newAddonDescription, setNewAddonDescription] = useState('');

  // Editing activity custom add-on sub-form states
  const [isAddingEditAddon, setIsAddingEditAddon] = useState(false);
  const [newEditAddonTitle, setNewEditAddonTitle] = useState('');
  const [newEditAddonPrice, setNewEditAddonPrice] = useState<number>(100);
  const [newEditAddonPriceType, setNewEditAddonPriceType] = useState<PriceType>('fixed');
  const [newEditAddonDescription, setNewEditAddonDescription] = useState('');

  // Flatten all activities with property association
  const allExperiences = properties.flatMap(prop => 
    (prop.activities || []).map(act => ({
      ...act,
      propertyId: prop.id,
      propertyName: prop.name,
      propertyCity: prop.city,
      propertyImage: prop.image
    }))
  );

  // Filtered list
  const filteredExperiences = allExperiences.filter(exp => {
    if (selectedCategory !== 'all' && exp.categoryId !== selectedCategory) return false;
    if (selectedStatus !== 'all' && exp.status !== selectedStatus) return false;
    if (selectedPropertyFilter !== 'all' && exp.propertyId !== selectedPropertyFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = exp.title.toLowerCase().includes(q) || (exp.titleAr && exp.titleAr.includes(q));
      const matchCat = exp.categoryName.toLowerCase().includes(q);
      const matchProp = exp.propertyName.toLowerCase().includes(q);
      if (!matchTitle && !matchCat && !matchProp) return false;
    }
    return true;
  });

  // Calculate Metrics
  const totalExperiences = allExperiences.length;
  const activeExperiences = allExperiences.filter(e => e.status === 'Active').length;
  const totalBookings = allExperiences.reduce((acc, e) => acc + (e.bookingsCount || 0), 0);
  const totalRevenue = allExperiences.reduce((acc, e) => acc + ((e.bookingsCount || 0) * e.price), 0);

  const priceTypeLabels: Record<PriceType, { en: string; ar: string }> = {
    per_person: { en: '/ person', ar: 'لكل شخص' },
    per_group: { en: '/ group', ar: 'لكل مجموعة' },
    hourly: { en: '/ hour', ar: 'بالساعة' },
    fixed: { en: 'total', ar: 'شامل' }
  };

  const handleToggleStatus = (propertyId: string, activityId: string) => {
    const prop = properties.find(p => p.id === propertyId);
    if (!prop) return;
    const updated = (prop.activities || []).map(a => {
      if (a.id === activityId) {
        return {
          ...a,
          status: (a.status === 'Active' ? 'Paused' : 'Active') as any
        };
      }
      return a;
    });
    onUpdatePropertyActivities(propertyId, updated);
  };

  const handleDeleteExperience = (propertyId: string, activityId: string, title?: string, propertyName?: string) => {
    const prop = properties.find(p => p.id === propertyId);
    const act = (prop?.activities || []).find(a => a.id === activityId);
    setDeleteTarget({
      propertyId,
      activityId,
      title: title || act?.title || 'this experience',
      propertyName: propertyName || prop?.name || 'this retreat'
    });
  };

  const confirmDeleteExperience = () => {
    if (!deleteTarget) return;
    const { propertyId, activityId } = deleteTarget;
    const prop = properties.find(p => p.id === propertyId);
    if (prop) {
      const updated = (prop.activities || []).filter(a => a.id !== activityId);
      onUpdatePropertyActivities(propertyId, updated);
    }
    setDeleteTarget(null);
    if (editingActivity && editingActivity.activity.id === activityId) {
      setEditingActivity(null);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;
    const { propertyId, activity } = editingActivity;
    const prop = properties.find(p => p.id === propertyId);
    if (!prop) return;
    const updated = (prop.activities || []).map(a => a.id === activity.id ? activity : a);
    onUpdatePropertyActivities(propertyId, updated);
    setEditingActivity(null);
  };

  const handleAddPreset = (category: CategoryDefinition, preset: any) => {
    const targetPropId = selectedTargetPropertyId || properties[0]?.id;
    if (!targetPropId) {
      alert('Please select or create a property first.');
      return;
    }
    const prop = properties.find(p => p.id === targetPropId);
    if (!prop) return;

    const newActivity: ActivityExperience = {
      id: `act-${targetPropId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      propertyId: targetPropId,
      hostId: prop.hostId,
      title: preset.nameEn,
      titleAr: preset.nameAr,
      categoryId: category.id,
      categoryName: category.nameEn,
      categoryNameAr: category.nameAr,
      categoryEmoji: category.emoji,
      description: `${preset.nameEn} offered on-site with luxury hospitality at ${prop.name}.`,
      images: [category.coverImage],
      price: preset.suggestedPrice,
      priceType: preset.defaultPriceType,
      duration: preset.defaultDuration,
      minGuests: 1,
      maxGuests: 10,
      status: 'Active',
      availabilityType: 'Instant',
      availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      timeSlots: getCategoryDefaultTimeSlots(category.id),
      locationType: 'on_site',
      locationDetails: `${prop.name} grounds`,
      included: preset.defaultIncluded,
      whatToBring: preset.defaultWhatToBring,
      addons: getSuggestedAddons(category.id),
      bookingsCount: 0,
      rating: 5.0,
      reviewsCount: 0,
      orderIndex: (prop.activities || []).length
    };

    onUpdatePropertyActivities(targetPropId, [...(prop.activities || []), newActivity]);
    setIsAddModalOpen(false);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPropId = selectedTargetPropertyId || properties[0]?.id;
    if (!targetPropId) {
      alert('Please select or create a property first.');
      return;
    }
    if (!customForm.title.trim()) {
      alert('Please enter an experience title.');
      return;
    }
    const prop = properties.find(p => p.id === targetPropId);
    if (!prop) return;

    const cat = ACTIVITY_CATEGORIES.find(c => c.id === customForm.categoryId) || ACTIVITY_CATEGORIES[0];
    const finalSlots = (customForm.timeSlots && customForm.timeSlots.length > 0)
      ? customForm.timeSlots
      : getCategoryDefaultTimeSlots(cat.id);

    const newActivity: ActivityExperience = {
      id: `act-custom-${targetPropId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      propertyId: targetPropId,
      hostId: prop.hostId,
      title: customForm.title.trim(),
      titleAr: customForm.titleAr.trim() || customForm.title.trim(),
      categoryId: cat.id,
      categoryName: cat.nameEn,
      categoryNameAr: cat.nameAr,
      categoryEmoji: cat.emoji,
      description: customForm.description || `Custom ${customForm.title} tailored for guests at ${prop.name}.`,
      images: [customForm.imageUrl || cat.coverImage],
      price: Number(customForm.price) || 150,
      priceType: customForm.priceType,
      duration: customForm.duration || '2 Hours',
      minGuests: Number(customForm.minGuests) || 1,
      maxGuests: Number(customForm.maxGuests) || 10,
      status: 'Active',
      availabilityType: 'Instant',
      availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      timeSlots: finalSlots,
      locationType: 'on_site',
      locationDetails: customForm.locationDetails,
      included: customForm.included ? customForm.included.split(',').map(s => s.trim()).filter(Boolean) : [],
      whatToBring: customForm.whatToBring ? customForm.whatToBring.split(',').map(s => s.trim()).filter(Boolean) : [],
      addons: customForm.addons || [],
      bookingsCount: 0,
      rating: 5.0,
      reviewsCount: 0,
      orderIndex: (prop.activities || []).length
    };

    onUpdatePropertyActivities(targetPropId, [...(prop.activities || []), newActivity]);
    setIsAddModalOpen(false);
    setCustomForm({
      title: '',
      titleAr: '',
      categoryId: 'culinary',
      description: '',
      price: 250,
      priceType: 'per_person',
      duration: '2 Hours',
      minGuests: 1,
      maxGuests: 10,
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
      locationDetails: 'Property grounds & facilities',
      included: 'Equipment, Welcome refreshments',
      whatToBring: 'Comfortable clothing',
      addons: getSuggestedAddons('culinary'),
      timeSlots: getCategoryDefaultTimeSlots('culinary')
    });
    setNewCustomSlot('');
  };

  // Time Slot helpers for Custom Form
  const handleAddTimeSlotToCustom = (slot: string) => {
    const trimmed = slot.trim();
    if (!trimmed) return;
    if ((customForm.timeSlots || []).includes(trimmed)) return;
    setCustomForm(prev => ({
      ...prev,
      timeSlots: [...(prev.timeSlots || []), trimmed]
    }));
    setNewCustomSlot('');
  };

  const handleRemoveTimeSlotFromCustom = (slotToRemove: string) => {
    setCustomForm(prev => ({
      ...prev,
      timeSlots: (prev.timeSlots || []).filter(s => s !== slotToRemove)
    }));
  };

  const handleResetTimeSlotsToCategoryDefault = () => {
    setCustomForm(prev => ({
      ...prev,
      timeSlots: getCategoryDefaultTimeSlots(prev.categoryId)
    }));
  };

  // Time Slot helpers for Editing Activity
  const handleAddTimeSlotToEdit = (slot: string) => {
    if (!editingActivity) return;
    const trimmed = slot.trim();
    if (!trimmed) return;
    const currentSlots = editingActivity.activity.timeSlots || [];
    if (currentSlots.includes(trimmed)) return;
    setEditingActivity({
      ...editingActivity,
      activity: {
        ...editingActivity.activity,
        timeSlots: [...currentSlots, trimmed]
      }
    });
    setNewEditCustomSlot('');
  };

  const handleRemoveTimeSlotFromEdit = (slotToRemove: string) => {
    if (!editingActivity) return;
    const currentSlots = editingActivity.activity.timeSlots || [];
    setEditingActivity({
      ...editingActivity,
      activity: {
        ...editingActivity.activity,
        timeSlots: currentSlots.filter(s => s !== slotToRemove)
      }
    });
  };

  // Add-on helpers for Custom Form
  const handleAddonToCustom = () => {
    if (!newAddonTitle.trim()) return;
    const newAddon: ActivityAddon = {
      id: `addon-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newAddonTitle.trim(),
      titleAr: newAddonTitleAr.trim() || undefined,
      price: Number(newAddonPrice) || 0,
      priceType: newAddonPriceType,
      description: newAddonDescription.trim() || undefined
    };
    setCustomForm(prev => ({
      ...prev,
      addons: [...(prev.addons || []), newAddon]
    }));
    setNewAddonTitle('');
    setNewAddonTitleAr('');
    setNewAddonPrice(100);
    setNewAddonDescription('');
    setIsAddingNewAddon(false);
  };

  const handleRemoveAddonFromCustom = (addonId: string) => {
    setCustomForm(prev => ({
      ...prev,
      addons: (prev.addons || []).filter(a => a.id !== addonId)
    }));
  };

  const handleQuickAddPresetAddon = (addon: ActivityAddon) => {
    if (customForm.addons?.some(a => a.title.toLowerCase() === addon.title.toLowerCase())) return;
    const copy: ActivityAddon = {
      ...addon,
      id: `addon-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    };
    setCustomForm(prev => ({
      ...prev,
      addons: [...(prev.addons || []), copy]
    }));
  };

  const handleResetAddonsToCategoryDefault = () => {
    setCustomForm(prev => ({
      ...prev,
      addons: getSuggestedAddons(prev.categoryId)
    }));
  };

  // Add-on helpers for Edit Experience Modal
  const handleAddonToEditActivity = () => {
    if (!editingActivity || !newEditAddonTitle.trim()) return;
    const newAddon: ActivityAddon = {
      id: `addon-edit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newEditAddonTitle.trim(),
      price: Number(newEditAddonPrice) || 0,
      priceType: newEditAddonPriceType,
      description: newEditAddonDescription.trim() || undefined
    };
    const currentAddons = editingActivity.activity.addons || [];
    setEditingActivity({
      ...editingActivity,
      activity: {
        ...editingActivity.activity,
        addons: [...currentAddons, newAddon]
      }
    });
    setNewEditAddonTitle('');
    setNewEditAddonPrice(100);
    setNewEditAddonDescription('');
    setIsAddingEditAddon(false);
  };

  const handleRemoveAddonFromEditActivity = (addonId: string) => {
    if (!editingActivity) return;
    const currentAddons = editingActivity.activity.addons || [];
    setEditingActivity({
      ...editingActivity,
      activity: {
        ...editingActivity.activity,
        addons: currentAddons.filter(a => a.id !== addonId)
      }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
      id="experiences-management-view"
    >
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-accent/15 text-accent text-[10px] font-black uppercase tracking-wider">
              {user.role === 'admin' ? 'Regional Experiences Hub' : 'Host Experiences Portfolio'}
            </span>
            <span className="text-xs font-bold text-muted-text">أنشطة وتجارب مسيرة</span>
          </div>
          <h1 className="text-3xl font-black italic text-primary uppercase leading-tight">
            Activities & Experiences
          </h1>
          <p className="text-xs text-muted-text font-bold uppercase tracking-wider mt-1">
            Manage culinary, marine, sports, heritage, wellness and custom retreat offerings
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 rounded-2xl bg-primary text-accent hover:opacity-95 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus size={16} />
            Add New Experience
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[28px] border border-border-misrah shadow-xs space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-text">Active Experiences</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black italic text-primary">{activeExperiences}</span>
            <span className="text-xs font-bold text-emerald-600">/ {totalExperiences} total</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-border-misrah shadow-xs space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-text">Guest Bookings</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black italic text-primary">{totalBookings}</span>
            <span className="text-xs font-bold text-accent">+18% MoM</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-border-misrah shadow-xs space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-text">Experience Revenue</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black italic text-primary">AED {totalRevenue.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-border-misrah shadow-xs space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-text">Average Rating</span>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black italic text-primary">4.95</span>
            <div className="flex text-amber-500">
              <Star size={14} fill="currentColor" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-6 rounded-[32px] border border-border-misrah shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search experiences by name, Arabic name, category, or property..."
              className="w-full pl-11 pr-4 py-3 bg-surface border border-border-misrah rounded-2xl text-xs font-bold text-primary outline-none focus:border-accent"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
            {/* Property Filter */}
            <select
              value={selectedPropertyFilter}
              onChange={e => setSelectedPropertyFilter(e.target.value)}
              className="py-3 px-4 bg-surface border border-border-misrah rounded-2xl text-xs font-bold text-primary outline-none focus:border-accent"
            >
              <option value="all">All Properties ({properties.length})</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="py-3 px-4 bg-surface border border-border-misrah rounded-2xl text-xs font-bold text-primary outline-none focus:border-accent"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Draft">Draft</option>
            </select>

            {/* View Toggle */}
            <div className="flex p-1 bg-surface rounded-2xl border border-border-misrah shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'grid' ? 'bg-white text-primary shadow-xs' : 'text-muted-text'}`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'table' ? 'bg-white text-primary shadow-xs' : 'text-muted-text'}`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* 9 Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide pt-2 border-t border-border-misrah/60">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all
              ${selectedCategory === 'all' ? 'bg-primary text-accent shadow-xs' : 'bg-surface border border-border-misrah text-muted-text hover:text-primary'}`}
          >
            All Categories
          </button>
          {ACTIVITY_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5
                ${selectedCategory === cat.id ? 'bg-primary text-accent shadow-xs' : 'bg-surface border border-border-misrah text-muted-text hover:text-primary'}`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.nameEn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid or Table Layout */}
      {filteredExperiences.length === 0 ? (
        <div className="p-16 bg-white rounded-[36px] border border-dashed border-border-misrah text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-accent/15 text-accent flex items-center justify-center mx-auto text-2xl">
            ✨
          </div>
          <div>
            <h3 className="text-lg font-black text-primary uppercase">No Experiences Match Your Filter</h3>
            <p className="text-xs text-muted-text mt-1">Try resetting filters or creating a new experience</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedStatus('all');
              setSelectedPropertyFilter('all');
            }}
            className="px-5 py-2.5 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary hover:border-accent"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperiences.map(exp => (
            <div 
              key={exp.id}
              className="bg-white rounded-[32px] border border-border-misrah overflow-hidden shadow-xs hover:shadow-luxury hover:border-accent/40 transition-all flex flex-col group"
            >
              <div className="h-48 relative overflow-hidden bg-surface">
                <img 
                  src={exp.images?.[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80'} 
                  alt={exp.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-linear-to-t from-primary/80 via-transparent to-transparent" />
                
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-white/90 backdrop-blur-sm text-primary text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                    <span>{exp.categoryEmoji}</span>
                    <span>{exp.categoryName}</span>
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(exp.propertyId, exp.id)}
                    className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-xs
                      ${exp.status === 'Active' 
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                        : 'bg-amber-500 text-white hover:bg-amber-600'}`}
                  >
                    {exp.status}
                  </button>
                </div>

                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <div className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-1 mb-0.5">
                    <Building2 size={11} /> {exp.propertyName} ({exp.propertyCity})
                  </div>
                  <h3 className="text-base font-black italic uppercase leading-tight truncate">{exp.title}</h3>
                  <p className="text-xs text-white/80 font-bold truncate">{exp.titleAr}</p>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-muted-text">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Clock size={13} /> {exp.duration}
                    </span>
                    <span className="flex items-center gap-1.5 font-bold">
                      <Users size={13} /> {exp.minGuests}-{exp.maxGuests} Guests
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-text line-clamp-2 leading-relaxed">
                    {exp.description}
                  </p>

                  <div className="p-3 bg-surface rounded-2xl flex items-center justify-between text-[11px]">
                    <span className="text-muted-text font-bold">Bookings: <b className="text-primary">{exp.bookingsCount || 0}</b></span>
                    <span className="text-muted-text font-bold">Earned: <b className="text-accent font-black">AED {((exp.bookingsCount || 0) * exp.price).toLocaleString()}</b></span>
                  </div>

                  {exp.addons && exp.addons.length > 0 && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-primary text-[11px]">
                        <Sparkles size={12} className="text-accent" />
                        <span>{exp.addons.length} Add-on{exp.addons.length === 1 ? '' : 's'}</span>
                      </div>
                      <span className="text-[10px] font-black text-accent uppercase tracking-wider">Configured</span>
                    </div>
                  )}

                  {exp.timeSlots && exp.timeSlots.length > 0 && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-surface border border-border-misrah text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-primary text-[11px] truncate">
                        <Clock size={12} className="text-accent shrink-0" />
                        <span className="truncate">{exp.timeSlots.length} Time Slot{exp.timeSlots.length === 1 ? '' : 's'}</span>
                      </div>
                      <span className="text-[10px] text-muted-text truncate font-bold max-w-[120px]">{exp.timeSlots[0]}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border-misrah/60 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-muted-text">Price</div>
                    <div className="text-lg font-black italic text-primary leading-tight">
                      AED {exp.price.toLocaleString()}
                      <span className="text-[10px] font-bold text-muted-text ml-1">
                        {priceTypeLabels[exp.priceType]?.en}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingActivity({ propertyId: exp.propertyId, activity: exp })}
                      className="w-9 h-9 rounded-xl bg-surface hover:bg-accent/20 text-primary flex items-center justify-center transition-colors"
                      title="Edit Experience"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteExperience(exp.propertyId, exp.id, exp.title, exp.propertyName)}
                      className="w-9 h-9 rounded-xl bg-surface hover:bg-danger/10 text-danger flex items-center justify-center transition-colors"
                      title="Delete Experience"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table Mode */
        <div className="bg-white rounded-[32px] border border-border-misrah overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface border-b border-border-misrah text-[10px] font-black uppercase tracking-wider text-muted-text">
                <tr>
                  <th className="p-4 pl-6">Experience & Retreat</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Duration & Capacity</th>
                  <th className="p-4">Bookings</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-misrah/60">
                {filteredExperiences.map(exp => (
                  <tr key={exp.id} className="hover:bg-surface/50 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <img 
                          src={exp.images?.[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80'} 
                          alt={exp.title}
                          className="w-12 h-12 rounded-xl object-cover shrink-0" 
                        />
                        <div>
                          <div className="font-black text-primary text-xs group-hover:text-accent transition-colors">{exp.title}</div>
                          <div className="text-[10px] text-muted-text font-bold">{exp.propertyName} • {exp.propertyCity}</div>
                          {exp.addons && exp.addons.length > 0 && (
                            <span className="inline-flex items-center gap-1 mt-0.5 text-[9px] font-bold text-accent">
                              <Sparkles size={10} /> {exp.addons.length} Add-on{exp.addons.length === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg bg-surface border border-border-misrah text-[10px] font-black text-primary">
                        {exp.categoryEmoji} {exp.categoryName}
                      </span>
                    </td>
                    <td className="p-4 font-black text-primary">
                      AED {exp.price.toLocaleString()} <span className="text-[9px] text-muted-text font-bold">{priceTypeLabels[exp.priceType]?.en}</span>
                    </td>
                    <td className="p-4 text-muted-text font-bold">
                      <div>{exp.duration}</div>
                      <div className="text-[10px]">{exp.minGuests}-{exp.maxGuests} Guests</div>
                      {exp.timeSlots && exp.timeSlots.length > 0 && (
                        <div className="text-[10px] text-accent font-bold mt-0.5 flex items-center gap-1">
                          <Clock size={10} />
                          <span>{exp.timeSlots.length} slot{exp.timeSlots.length === 1 ? '' : 's'}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-bold text-primary">
                      <div>{exp.bookingsCount || 0} Bookings</div>
                      <div className="text-[10px] text-accent font-black">AED {((exp.bookingsCount || 0) * exp.price).toLocaleString()}</div>
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(exp.propertyId, exp.id)}
                        className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider
                          ${exp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}
                      >
                        {exp.status}
                      </button>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingActivity({ propertyId: exp.propertyId, activity: exp })}
                          className="w-8 h-8 rounded-lg bg-surface hover:bg-accent/20 text-primary flex items-center justify-center transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExperience(exp.propertyId, exp.id, exp.title, exp.propertyName)}
                          className="w-8 h-8 rounded-lg bg-surface hover:bg-danger/10 text-danger flex items-center justify-center transition-colors"
                          title="Delete Experience"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Experience Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-4xl p-6 md:p-8 relative z-10 shadow-luxury space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border-misrah">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-accent/20 text-accent">
                      <Sparkles size={18} />
                    </span>
                    <div>
                      <h3 className="text-xl font-black italic text-primary uppercase">Add New Experience</h3>
                      <p className="text-xs text-muted-text font-bold">إضافة نشاط وتجربة جديدة إلى العقار</p>
                    </div>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-surface hover:bg-border-misrah flex items-center justify-center text-primary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Target Property Selector */}
              {properties.length > 0 ? (
                <div className="p-4 rounded-2xl bg-surface border border-border-misrah flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="text-accent flex-shrink-0" size={20} />
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-muted-text">Target Retreat / Listing</div>
                      <div className="text-xs font-bold text-primary">Select which property will offer this experience:</div>
                    </div>
                  </div>
                  <select
                    value={selectedTargetPropertyId || properties[0]?.id}
                    onChange={(e) => setSelectedTargetPropertyId(e.target.value)}
                    className="p-2.5 bg-white border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent min-w-[220px]"
                  >
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.city}) — {(p.activities || []).length} activities
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs font-bold flex items-center gap-3">
                  <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
                  <div>You have no properties listed yet. Please add a listing first to assign experiences.</div>
                </div>
              )}

              {/* Add Mode Switcher (Presets vs Custom) */}
              <div className="flex p-1.5 bg-surface rounded-2xl border border-border-misrah gap-1">
                <button
                  type="button"
                  onClick={() => setAddMode('preset')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2
                    ${addMode === 'preset' ? 'bg-primary text-accent shadow-sm' : 'text-muted-text hover:text-primary'}`}
                >
                  <Sparkles size={14} />
                  Curated Catalog ({ACTIVITY_CATEGORIES.length} Categories)
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('custom')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2
                    ${addMode === 'custom' ? 'bg-primary text-accent shadow-sm' : 'text-muted-text hover:text-primary'}`}
                >
                  <Plus size={14} />
                  Bespoke / Custom Experience
                </button>
              </div>

              {/* Mode 1: Presets Catalog */}
              {addMode === 'preset' && (
                <div className="space-y-4">
                  {/* Category Pill Filters & Search */}
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" size={15} />
                      <input 
                        type="text"
                        placeholder="Search curated activities (e.g. Chef, Yoga, Jet Ski, BBQ, Stargazing)..."
                        value={modalSearch}
                        onChange={e => setModalSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  {/* Horizontal Category Scroll */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setModalCategory('all')}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase whitespace-nowrap transition-all
                        ${modalCategory === 'all' ? 'bg-primary text-accent' : 'bg-surface text-muted-text hover:text-primary border border-border-misrah'}`}
                    >
                      All Categories
                    </button>
                    {ACTIVITY_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setModalCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5
                          ${modalCategory === cat.id ? 'bg-primary text-accent' : 'bg-surface text-muted-text hover:text-primary border border-border-misrah'}`}
                      >
                        <span>{cat.emoji}</span>
                        <span>{cat.nameEn}</span>
                      </button>
                    ))}
                  </div>

                  {/* Presets List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                    {ACTIVITY_CATEGORIES
                      .filter(cat => modalCategory === 'all' || cat.id === modalCategory)
                      .flatMap(cat => 
                        cat.activities.map(preset => ({ ...preset, category: cat }))
                      )
                      .filter(item => {
                        if (!modalSearch.trim()) return true;
                        const q = modalSearch.toLowerCase();
                        return (
                          item.nameEn.toLowerCase().includes(q) ||
                          item.nameAr.includes(q) ||
                          item.category.nameEn.toLowerCase().includes(q)
                        );
                      })
                      .map((item, idx) => (
                        <div 
                          key={`${item.category.id}-${item.nameEn}-${idx}`}
                          className="p-4 rounded-2xl bg-surface border border-border-misrah hover:border-accent/50 transition-all flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-white border border-border-misrah font-bold text-primary flex items-center gap-1">
                                {item.category.emoji} {item.category.nameEn}
                              </span>
                              <div className="text-xs font-black text-primary">
                                AED {item.suggestedPrice} <span className="text-[9px] text-muted-text font-bold">{priceTypeLabels[item.defaultPriceType]?.en}</span>
                              </div>
                            </div>
                            <h4 className="text-sm font-black text-primary leading-tight group-hover:text-accent transition-colors">
                              {item.nameEn}
                            </h4>
                            <p className="text-[11px] font-bold text-muted-text mb-2" dir="rtl">
                              {item.nameAr}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-text mb-2">
                              <Clock size={12} className="text-accent" />
                              <span>{item.defaultDuration}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {item.defaultIncluded.slice(0, 2).map((inc, i) => (
                                <span key={i} className="text-[9px] px-2 py-0.5 rounded-md bg-white text-muted-text font-semibold truncate max-w-[180px]">
                                  ✓ {inc}
                                </span>
                              ))}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddPreset(item.category, item)}
                            disabled={properties.length === 0}
                            className="w-full py-2 bg-white hover:bg-primary hover:text-accent border border-border-misrah rounded-xl text-xs font-black uppercase tracking-wider text-primary transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                          >
                            <Plus size={14} />
                            Add Experience
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Mode 2: Custom Experience Form */}
              {addMode === 'custom' && (
                <form onSubmit={handleAddCustom} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">
                        Title (English) *
                      </label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Sunrise Rooftop Sound Healing"
                        value={customForm.title}
                        onChange={e => setCustomForm({ ...customForm, title: e.target.value })}
                        className="w-full p-3 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">
                        Title (Arabic)
                      </label>
                      <input 
                        type="text"
                        placeholder="مثال: جلسة استشفاء بالصوت مع شروق الشمس"
                        value={customForm.titleAr}
                        onChange={e => setCustomForm({ ...customForm, titleAr: e.target.value })}
                        className="w-full p-3 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                        dir="rtl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">
                        Category *
                      </label>
                      <select
                        value={customForm.categoryId}
                        onChange={e => {
                          const newCat = e.target.value;
                          setCustomForm({ 
                            ...customForm, 
                            categoryId: newCat,
                            addons: getSuggestedAddons(newCat),
                            timeSlots: getCategoryDefaultTimeSlots(newCat)
                          });
                        }}
                        className="w-full p-3 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                      >
                        {ACTIVITY_CATEGORIES.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.emoji} {c.nameEn} ({c.nameAr})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">
                        Price (AED) *
                      </label>
                      <input 
                        type="number"
                        min="0"
                        required
                        value={customForm.price}
                        onChange={e => setCustomForm({ ...customForm, price: Number(e.target.value) })}
                        className="w-full p-3 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">
                        Pricing Model
                      </label>
                      <select
                        value={customForm.priceType}
                        onChange={e => setCustomForm({ ...customForm, priceType: e.target.value as PriceType })}
                        className="w-full p-3 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                      >
                        <option value="per_person">Per Person / لكل شخص</option>
                        <option value="per_group">Per Group / لكل مجموعة</option>
                        <option value="hourly">Hourly Rate / بالساعة</option>
                        <option value="fixed">Fixed Total / شامل المجموع</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">
                        Duration
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. 90 Minutes"
                        value={customForm.duration}
                        onChange={e => setCustomForm({ ...customForm, duration: e.target.value })}
                        className="w-full p-3 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">
                        Min Guests
                      </label>
                      <input 
                        type="number"
                        min="1"
                        value={customForm.minGuests}
                        onChange={e => setCustomForm({ ...customForm, minGuests: Number(e.target.value) })}
                        className="w-full p-3 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">
                        Max Guests
                      </label>
                      <input 
                        type="number"
                        min="1"
                        value={customForm.maxGuests}
                        onChange={e => setCustomForm({ ...customForm, maxGuests: Number(e.target.value) })}
                        className="w-full p-3 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">
                      Cover Photo URL
                    </label>
                    <input 
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={customForm.imageUrl}
                      onChange={e => setCustomForm({ ...customForm, imageUrl: e.target.value })}
                      className="w-full p-3 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">
                        Inclusions (comma-separated)
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. Tibetan Singing Bowls, Herbal Tea, Mats"
                        value={customForm.included}
                        onChange={e => setCustomForm({ ...customForm, included: e.target.value })}
                        className="w-full p-3 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">
                        What to Bring (comma-separated)
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. Comfortable loose clothing, Sun protection"
                        value={customForm.whatToBring}
                        onChange={e => setCustomForm({ ...customForm, whatToBring: e.target.value })}
                        className="w-full p-3 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  {/* Available Time Slots & Schedule (User selectable in mobile preview) */}
                  <div className="p-5 rounded-3xl bg-[#F8F9FA] border border-border-misrah/80 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-misrah">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Clock size={14} />
                          </div>
                          <span className="text-xs font-black uppercase tracking-wider text-primary">
                            Available Time Slots & Schedule
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-wider">
                            Guest Selectable
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-text font-medium mt-0.5">
                          Configure daily time slots guests can pick from when reserving this experience
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-text">
                          {(customForm.timeSlots || []).length} Active Slot{(customForm.timeSlots || []).length === 1 ? '' : 's'}
                        </span>
                        <button
                          type="button"
                          onClick={handleResetTimeSlotsToCategoryDefault}
                          className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1"
                          title="Reset to category standard time slots"
                        >
                          ↺ Reset Defaults
                        </button>
                      </div>
                    </div>

                    {/* Quick Add Presets */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-text block">
                        Quick Add Preset Slots:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {STANDARD_TIME_SLOT_PRESETS.map((preset) => {
                          const isAlreadyAdded = (customForm.timeSlots || []).includes(preset.time);
                          return (
                            <button
                              key={preset.time}
                              type="button"
                              disabled={isAlreadyAdded}
                              onClick={() => handleAddTimeSlotToCustom(preset.time)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 border ${
                                isAlreadyAdded
                                  ? 'bg-primary/5 text-primary/40 border-border-misrah cursor-not-allowed'
                                  : 'bg-white text-primary border-border-misrah hover:border-accent hover:bg-accent/5 active:scale-95'
                              }`}
                            >
                              <span>+ {preset.label}</span>
                              <span className="text-[9px] text-muted-text font-normal">({preset.time})</span>
                              {isAlreadyAdded && <Check size={11} className="text-emerald-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Current Time Slots List */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-text block">
                        Configured Slots for this Experience:
                      </span>

                      {(!customForm.timeSlots || customForm.timeSlots.length === 0) ? (
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                          <p className="text-xs text-amber-800 font-bold">
                            ⚠️ No time slots configured. Add at least one slot so guests can choose a booking time.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {customForm.timeSlots.map((slot) => (
                            <div
                              key={slot}
                              className="p-2.5 rounded-xl bg-white border border-border-misrah shadow-2xs flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Clock size={13} className="text-accent shrink-0" />
                                <span className="text-xs font-black text-primary truncate">{slot}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveTimeSlotFromCustom(slot)}
                                className="w-6 h-6 rounded-lg bg-surface hover:bg-danger/10 text-muted-text hover:text-danger flex items-center justify-center transition-colors shrink-0"
                                title="Remove this slot"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add Custom Slot Input */}
                    <div className="pt-2 flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 15:00 - 17:30 or 08:00 AM - 10:00 AM"
                        value={newCustomSlot}
                        onChange={e => setNewCustomSlot(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTimeSlotToCustom(newCustomSlot);
                          }
                        }}
                        className="flex-1 p-2.5 bg-white border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddTimeSlotToCustom(newCustomSlot)}
                        disabled={!newCustomSlot.trim()}
                        className="px-4 py-2.5 rounded-xl bg-primary text-accent text-xs font-black uppercase tracking-wider hover:opacity-95 disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-2xs"
                      >
                        <Plus size={13} />
                        <span>Add Slot</span>
                      </button>
                    </div>
                  </div>

                  {/* Experience Add-ons & Upgrades (Like the one in mobile preview) */}
                  <div className="p-5 rounded-3xl bg-[#FAF9F5] border border-accent/30 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-misrah">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
                            <Sparkles size={14} />
                          </div>
                          <span className="text-xs font-black uppercase tracking-wider text-primary">
                            Experience Add-ons & Extras
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-accent/25 text-primary text-[9px] font-black uppercase tracking-wider">
                            Like Preview
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-text font-medium mt-0.5">
                          Configure optional extras and upgrades guests can add during mobile reservation
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-text">
                          {(customForm.addons || []).length} Active Add-on{(customForm.addons || []).length === 1 ? '' : 's'}
                        </span>
                        <button
                          type="button"
                          onClick={handleResetAddonsToCategoryDefault}
                          className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1"
                          title="Load default recommendations for this category"
                        >
                          ↺ Reset Defaults
                        </button>
                      </div>
                    </div>

                    {/* Quick Suggestions based on Category */}
                    {CATEGORY_DEFAULT_ADDONS[customForm.categoryId] && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-text block">
                          Quick Add Category Recommendations:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {CATEGORY_DEFAULT_ADDONS[customForm.categoryId].map((sug) => {
                            const isAlreadyAdded = (customForm.addons || []).some(
                              a => a.title.toLowerCase() === sug.title.toLowerCase()
                            );
                            return (
                              <button
                                key={sug.id}
                                type="button"
                                onClick={() => handleQuickAddPresetAddon(sug)}
                                disabled={isAlreadyAdded}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                                  isAlreadyAdded 
                                    ? 'bg-surface/80 text-muted-text border border-border-misrah cursor-not-allowed opacity-60' 
                                    : 'bg-white hover:bg-accent hover:text-primary text-primary border border-border-misrah shadow-2xs hover:scale-102'
                                }`}
                              >
                                <span>{isAlreadyAdded ? '✓' : '+'}</span>
                                <span>{sug.title}</span>
                                <span className="font-black text-accent group-hover:text-primary">(+AED {sug.price})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Active Configured Add-ons List (Rendered like the Mobile App Simulator Preview) */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-text block">
                        Configured Add-ons for this Experience:
                      </span>
                      {(!customForm.addons || customForm.addons.length === 0) ? (
                        <div className="p-4 rounded-2xl bg-white border border-dashed border-border-misrah text-center">
                          <p className="text-xs text-muted-text font-medium">
                            No add-ons selected yet. Pick from recommendations above or create a bespoke upgrade below.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {customForm.addons.map((addon) => (
                            <div
                              key={addon.id}
                              className="p-3.5 rounded-2xl border transition-all bg-white border-border-misrah hover:border-accent/60 shadow-2xs flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-black text-primary truncate">
                                    {addon.title}
                                  </span>
                                  {addon.titleAr && (
                                    <span className="text-[10px] text-muted-text truncate" dir="rtl">
                                      ({addon.titleAr})
                                    </span>
                                  )}
                                </div>
                                {addon.description && (
                                  <p className="text-[10px] text-muted-text line-clamp-1 mt-0.5">
                                    {addon.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs font-black text-accent">
                                    +AED {addon.price}
                                  </span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border-misrah font-bold text-muted-text">
                                    {addon.priceType === 'per_person' ? 'Per Person' : addon.priceType === 'hourly' ? 'Per Hour' : 'Fixed Total'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* Simulated Preview Checkbox */}
                                <div 
                                  className="w-7 h-7 rounded-xl bg-accent text-primary flex items-center justify-center font-black shadow-2xs"
                                  title="Guest preview checkbox in mobile app"
                                >
                                  <Check size={14} className="stroke-[3]" />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAddonFromCustom(addon.id)}
                                  className="w-7 h-7 rounded-xl bg-surface hover:bg-danger/10 text-muted-text hover:text-danger flex items-center justify-center transition-colors"
                                  title="Remove add-on"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add Custom Add-on Button & Drawer */}
                    {!isAddingNewAddon ? (
                      <button
                        type="button"
                        onClick={() => setIsAddingNewAddon(true)}
                        className="w-full py-2.5 px-4 rounded-xl border border-dashed border-accent/50 hover:border-accent bg-white/60 hover:bg-white text-primary text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-2xs"
                      >
                        <Plus size={14} className="text-accent" />
                        <span>Add Custom Add-on / Bespoke Extra</span>
                      </button>
                    ) : (
                      <div className="p-4 rounded-2xl bg-white border border-accent/40 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-primary uppercase">
                            New Custom Add-on
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsAddingNewAddon(false)}
                            className="text-muted-text hover:text-primary"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-black uppercase text-muted-text block mb-1">
                              Add-on Name (English) *
                            </label>
                            <input
                              type="text"
                              value={newAddonTitle}
                              onChange={e => setNewAddonTitle(e.target.value)}
                              placeholder="e.g. Dedicated Barista & Specialty Coffee Bar"
                              className="w-full p-2.5 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase text-muted-text block mb-1">
                              Add-on Name (Arabic)
                            </label>
                            <input
                              type="text"
                              value={newAddonTitleAr}
                              onChange={e => setNewAddonTitleAr(e.target.value)}
                              placeholder="مثال: باريستا مخصص ومشروبات قهوة مختصة"
                              dir="rtl"
                              className="w-full p-2.5 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-black uppercase text-muted-text block mb-1">
                              Extra Price (AED) *
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={newAddonPrice}
                              onChange={e => setNewAddonPrice(Number(e.target.value))}
                              className="w-full p-2.5 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase text-muted-text block mb-1">
                              Pricing Model
                            </label>
                            <select
                              value={newAddonPriceType}
                              onChange={e => setNewAddonPriceType(e.target.value as PriceType)}
                              className="w-full p-2.5 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                            >
                              <option value="fixed">Fixed Total / شامل المجموع</option>
                              <option value="per_person">Per Person / لكل شخص</option>
                              <option value="hourly">Hourly / بالساعة</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase text-muted-text block mb-1">
                            Short Description (Optional)
                          </label>
                          <input
                            type="text"
                            value={newAddonDescription}
                            onChange={e => setNewAddonDescription(e.target.value)}
                            placeholder="e.g. Single-origin V60, Chemex, and local spiced Karak"
                            className="w-full p-2.5 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsAddingNewAddon(false)}
                            className="px-4 py-2 rounded-xl border border-border-misrah text-xs font-bold text-muted-text hover:bg-surface"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleAddonToCustom}
                            disabled={!newAddonTitle.trim()}
                            className="px-5 py-2 rounded-xl bg-primary text-accent text-xs font-black uppercase tracking-wider hover:opacity-95 disabled:opacity-50 transition-all shadow-xs"
                          >
                            Add to Experience
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">
                      Experience Description
                    </label>
                    <textarea 
                      rows={3}
                      placeholder="Describe the atmosphere, equipment, host guidance and schedule..."
                      value={customForm.description}
                      onChange={e => setCustomForm({ ...customForm, description: e.target.value })}
                      className="w-full p-3 bg-surface border border-border-misrah rounded-xl text-xs font-medium text-primary outline-none focus:border-accent"
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-border-misrah">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="flex-1 py-3.5 rounded-2xl border border-border-misrah text-xs font-black uppercase tracking-wider text-primary hover:bg-surface transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={properties.length === 0}
                      className="flex-[2] py-3.5 bg-primary text-accent rounded-2xl text-xs font-black uppercase tracking-wider hover:opacity-95 shadow-md transition-all disabled:opacity-50"
                    >
                      Publish Custom Experience
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Activity Modal */}
      <AnimatePresence>
        {editingActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingActivity(null)}
              className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-xl p-8 relative z-10 shadow-luxury space-y-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border-misrah">
                <div>
                  <h3 className="text-xl font-black italic text-primary uppercase">Edit Experience</h3>
                  <p className="text-xs text-muted-text">{editingActivity.activity.title}</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setEditingActivity(null)}
                  className="w-8 h-8 rounded-full bg-surface hover:bg-border-misrah flex items-center justify-center text-primary"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">Title (EN)</label>
                    <input 
                      type="text"
                      value={editingActivity.activity.title}
                      onChange={e => setEditingActivity({
                        ...editingActivity,
                        activity: { ...editingActivity.activity, title: e.target.value }
                      })}
                      className="w-full p-3 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">Title (AR)</label>
                    <input 
                      type="text"
                      value={editingActivity.activity.titleAr || ''}
                      onChange={e => setEditingActivity({
                        ...editingActivity,
                        activity: { ...editingActivity.activity, titleAr: e.target.value }
                      })}
                      className="w-full p-3 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">Price (AED)</label>
                    <input 
                      type="number"
                      value={editingActivity.activity.price}
                      onChange={e => setEditingActivity({
                        ...editingActivity,
                        activity: { ...editingActivity.activity, price: Number(e.target.value) }
                      })}
                      className="w-full p-3 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">Pricing Model</label>
                    <select
                      value={editingActivity.activity.priceType}
                      onChange={e => setEditingActivity({
                        ...editingActivity,
                        activity: { ...editingActivity.activity, priceType: e.target.value as PriceType }
                      })}
                      className="w-full p-3 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                    >
                      <option value="per_person">Per Person / لكل شخص</option>
                      <option value="per_group">Per Group / لكل مجموعة</option>
                      <option value="hourly">Hourly Rate / بالساعة</option>
                      <option value="fixed">Fixed Total / شامل المجموع</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">Duration</label>
                    <input 
                      type="text"
                      value={editingActivity.activity.duration}
                      onChange={e => setEditingActivity({
                        ...editingActivity,
                        activity: { ...editingActivity.activity, duration: e.target.value }
                      })}
                      className="w-full p-3 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">Min Guests</label>
                    <input 
                      type="number"
                      value={editingActivity.activity.minGuests}
                      onChange={e => setEditingActivity({
                        ...editingActivity,
                        activity: { ...editingActivity.activity, minGuests: Number(e.target.value) }
                      })}
                      className="w-full p-3 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">Max Guests</label>
                    <input 
                      type="number"
                      value={editingActivity.activity.maxGuests}
                      onChange={e => setEditingActivity({
                        ...editingActivity,
                        activity: { ...editingActivity.activity, maxGuests: Number(e.target.value) }
                      })}
                      className="w-full p-3 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">Status</label>
                  <select
                    value={editingActivity.activity.status}
                    onChange={e => setEditingActivity({
                      ...editingActivity,
                      activity: { ...editingActivity.activity, status: e.target.value as any }
                    })}
                    className="w-full p-3 bg-surface border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                  >
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                    <option value="Draft">Draft</option>
                    <option value="SoldOut">Sold Out</option>
                  </select>
                </div>

                {/* Available Time Slots Management in Edit Modal */}
                <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-border-misrah space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-accent" />
                      <span className="text-xs font-black uppercase text-primary">
                        Available Time Slots ({(editingActivity.activity.timeSlots || []).length})
                      </span>
                    </div>
                  </div>

                  {/* Preset quick-add buttons */}
                  <div className="flex flex-wrap gap-1">
                    {STANDARD_TIME_SLOT_PRESETS.map(preset => {
                      const isAdded = (editingActivity.activity.timeSlots || []).includes(preset.time);
                      return (
                        <button
                          key={preset.time}
                          type="button"
                          disabled={isAdded}
                          onClick={() => handleAddTimeSlotToEdit(preset.time)}
                          className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-colors ${
                            isAdded
                              ? 'bg-primary/5 text-primary/40 border-border-misrah cursor-not-allowed'
                              : 'bg-white text-primary border-border-misrah hover:border-accent'
                          }`}
                        >
                          + {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Slots list */}
                  {(!editingActivity.activity.timeSlots || editingActivity.activity.timeSlots.length === 0) ? (
                    <p className="text-[11px] text-muted-text italic">No time slots added. Add slots so guests can pick a preferred time.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {editingActivity.activity.timeSlots.map(slot => (
                        <div
                          key={slot}
                          className="p-2 rounded-xl bg-white border border-border-misrah flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="font-bold text-primary text-[11px] truncate">{slot}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTimeSlotFromEdit(slot)}
                            className="w-5 h-5 rounded hover:bg-danger/10 text-muted-text hover:text-danger flex items-center justify-center shrink-0"
                            title="Remove slot"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Custom Slot */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="e.g. 16:30 - 18:30"
                      value={newEditCustomSlot}
                      onChange={e => setNewEditCustomSlot(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTimeSlotToEdit(newEditCustomSlot);
                        }
                      }}
                      className="flex-1 p-2 bg-white border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTimeSlotToEdit(newEditCustomSlot)}
                      disabled={!newEditCustomSlot.trim()}
                      className="px-3 py-2 bg-primary text-accent rounded-xl text-xs font-black uppercase disabled:opacity-50"
                    >
                      Add Slot
                    </button>
                  </div>
                </div>

                {/* Experience Add-ons Management in Edit Modal */}
                <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-accent/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={13} className="text-accent" />
                      <span className="text-xs font-black uppercase text-primary">
                        Experience Add-ons ({(editingActivity.activity.addons || []).length})
                      </span>
                    </div>
                    {!isAddingEditAddon && (
                      <button
                        type="button"
                        onClick={() => setIsAddingEditAddon(true)}
                        className="text-[10px] font-black uppercase tracking-wider text-accent hover:underline flex items-center gap-1"
                      >
                        <Plus size={12} /> Add Upgrade
                      </button>
                    )}
                  </div>

                  {/* Add-ons list */}
                  {(!editingActivity.activity.addons || editingActivity.activity.addons.length === 0) ? (
                    <p className="text-[11px] text-muted-text italic">No add-ons attached to this experience yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {editingActivity.activity.addons.map((addon) => (
                        <div
                          key={addon.id}
                          className="p-3 rounded-xl bg-white border border-border-misrah flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-black text-primary truncate block">{addon.title}</span>
                            <div className="flex items-center gap-2 text-[10px] text-muted-text">
                              <span className="font-bold text-accent">+AED {addon.price}</span>
                              <span>•</span>
                              <span>{addon.priceType === 'per_person' ? 'Per Person' : addon.priceType === 'hourly' ? 'Hourly' : 'Fixed'}</span>
                              {addon.description && <span>• {addon.description}</span>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAddonFromEditActivity(addon.id)}
                            className="p-1 rounded text-muted-text hover:text-danger hover:bg-danger/10"
                            title="Remove add-on"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sub-form to add an add-on to this existing activity */}
                  {isAddingEditAddon && (
                    <div className="p-3 rounded-xl bg-white border border-accent/40 space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-primary">New Add-on</span>
                        <button type="button" onClick={() => setIsAddingEditAddon(false)} className="text-muted-text">
                          <X size={13} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Add-on Name *"
                          value={newEditAddonTitle}
                          onChange={e => setNewEditAddonTitle(e.target.value)}
                          className="p-2 bg-surface border border-border-misrah rounded-lg text-xs font-bold text-primary outline-none focus:border-accent"
                        />
                        <input
                          type="number"
                          placeholder="Price (AED) *"
                          value={newEditAddonPrice}
                          onChange={e => setNewEditAddonPrice(Number(e.target.value))}
                          className="p-2 bg-surface border border-border-misrah rounded-lg text-xs font-bold text-primary outline-none focus:border-accent"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={newEditAddonPriceType}
                          onChange={e => setNewEditAddonPriceType(e.target.value as PriceType)}
                          className="p-2 bg-surface border border-border-misrah rounded-lg text-[11px] font-bold text-primary outline-none focus:border-accent flex-1"
                        >
                          <option value="fixed">Fixed Total</option>
                          <option value="per_person">Per Person</option>
                          <option value="hourly">Hourly</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Short description (optional)"
                          value={newEditAddonDescription}
                          onChange={e => setNewEditAddonDescription(e.target.value)}
                          className="p-2 bg-surface border border-border-misrah rounded-lg text-[11px] text-primary outline-none focus:border-accent flex-2"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingEditAddon(false)}
                          className="px-3 py-1 rounded-lg text-[11px] font-bold text-muted-text"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddonToEditActivity}
                          disabled={!newEditAddonTitle.trim()}
                          className="px-4 py-1 rounded-lg bg-primary text-accent text-[11px] font-black uppercase disabled:opacity-50"
                        >
                          Add Add-on
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">Description</label>
                  <textarea 
                    value={editingActivity.activity.description}
                    onChange={e => setEditingActivity({
                      ...editingActivity,
                      activity: { ...editingActivity.activity, description: e.target.value }
                    })}
                    rows={3}
                    className="w-full p-3 bg-surface border border-border-misrah rounded-xl text-xs font-medium text-primary outline-none focus:border-accent"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-border-misrah">
                  <button
                    type="button"
                    onClick={() => {
                      const toDel = editingActivity;
                      setEditingActivity(null);
                      if (toDel) {
                        handleDeleteExperience(toDel.propertyId, toDel.activity.id, toDel.activity.title);
                      }
                    }}
                    className="p-3.5 rounded-2xl border border-danger/20 text-danger hover:bg-danger/10 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                    title="Delete Experience"
                  >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingActivity(null)}
                    className="flex-1 py-3.5 rounded-2xl border border-border-misrah text-xs font-black uppercase tracking-wider text-primary hover:bg-surface transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-3.5 bg-primary text-accent rounded-2xl text-xs font-black uppercase tracking-wider hover:opacity-95 shadow-md transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
              className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 relative z-10 shadow-luxury space-y-6 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mx-auto">
                <Trash2 size={26} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black italic text-primary uppercase">Delete Experience</h3>
                <p className="text-xs text-muted-text font-medium leading-relaxed">
                  Are you sure you want to permanently remove <strong className="text-primary font-black">"{deleteTarget.title}"</strong> from <span className="text-primary font-bold">{deleteTarget.propertyName}</span>?
                </p>
                <p className="text-[11px] text-danger font-bold pt-1">
                  This action will remove the experience from guest bookings and mobile exploration.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3.5 rounded-2xl border border-border-misrah text-xs font-black uppercase tracking-wider text-primary hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteExperience}
                  className="flex-1 py-3.5 bg-danger text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-danger/90 transition-all shadow-md"
                >
                  Delete Experience
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
