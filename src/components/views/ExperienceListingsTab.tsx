import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Loader2,
  TriangleAlert,
  LayoutList,
  Sparkles,
  CheckCircle2,
  Edit,
  Trash2,
  X,
  Search,
  Minus,
  Home,
} from 'lucide-react';
import { listAdminExperiences } from '../../features/experiences/api';
import type { ApiExperienceListItem } from '../../features/experiences/types';
import {
  addExperiencesToListing,
  createExperienceListing,
  deleteExperienceListing,
  listExperienceListings,
  removeExperiencesFromListing,
  toggleExperienceListingActive,
  toggleExperienceListingHomepage,
  updateExperienceListing,
} from '../../features/experienceListings/api';
import type { ExperienceListing } from '../../features/experienceListings/types';

// Experience Listings — home page sections of experiences, mirroring Asset
// Listings (Assets Queue → Asset Listings). Backed by /experience-listings.

interface ListingFormState {
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  displayOrder: number;
  isActive: boolean;
  showOnHomepage: boolean;
}

type BoolFilter = 'all' | 'yes' | 'no';
const toBoolParam = (f: BoolFilter) => (f === 'all' ? undefined : f === 'yes');

const inputClass = 'w-full bg-surface border border-border-misrah rounded-xl px-4 py-3 text-xs font-bold text-primary outline-none focus:border-accent';
const labelClass = 'text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1';
const filterSelectClass = 'py-3 px-4 bg-surface border border-border-misrah rounded-2xl text-xs font-bold text-primary outline-none focus:border-accent cursor-pointer';

export const ExperienceListingsTab = () => {
  const [listings, setListings] = useState<ExperienceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // GET /experience-listings filters
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<BoolFilter>('all');
  const [homepageFilter, setHomepageFilter] = useState<BoolFilter>('all');

  const [formTarget, setFormTarget] = useState<ExperienceListing | 'new' | null>(null);
  const [form, setForm] = useState<ListingFormState>({
    titleEn: '', titleAr: '', subtitleEn: '', subtitleAr: '', displayOrder: 1, isActive: true, showOnHomepage: false,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [managingId, setManagingId] = useState<string | null>(null);
  const [mutatingExperienceId, setMutatingExperienceId] = useState<string | null>(null);
  const [manageError, setManageError] = useState<string | null>(null);

  // Experiences for the picker (GET /admin/experiences, first 100).
  const [experiences, setExperiences] = useState<ApiExperienceListItem[]>([]);
  const [isLoadingExperiences, setIsLoadingExperiences] = useState(true);
  const [experiencesError, setExperiencesError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await listExperienceListings({
        search: debouncedSearch || undefined,
        isActive: toBoolParam(activeFilter),
        showOnHomepage: toBoolParam(homepageFilter),
      });
      setListings([...result].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load experience listings.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, activeFilter, homepageFilter]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    listAdminExperiences({ page: 1, limit: 100 })
      .then(res => setExperiences(res.data))
      .catch(err => setExperiencesError(err?.message || 'Failed to load experiences.'))
      .finally(() => setIsLoadingExperiences(false));
  }, []);

  const managing = listings.find(l => l._id === managingId) ?? null;

  const openCreate = () => {
    const maxOrder = listings.reduce((max, l) => Math.max(max, l.displayOrder ?? 0), 0);
    setForm({ titleEn: '', titleAr: '', subtitleEn: '', subtitleAr: '', displayOrder: maxOrder + 1, isActive: true, showOnHomepage: false });
    setFormError(null);
    setFormTarget('new');
  };

  const openEdit = (listing: ExperienceListing) => {
    setForm({
      titleEn: listing.title.en,
      titleAr: listing.title.ar,
      subtitleEn: listing.subtitle.en,
      subtitleAr: listing.subtitle.ar,
      displayOrder: listing.displayOrder,
      isActive: listing.isActive,
      showOnHomepage: listing.showOnHomepage,
    });
    setFormError(null);
    setFormTarget(listing);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titleEn.trim() || !form.titleAr.trim() || !form.subtitleEn.trim() || !form.subtitleAr.trim()) {
      setFormError('Title and subtitle are required in both English and Arabic.');
      return;
    }
    const values = {
      title: { en: form.titleEn.trim(), ar: form.titleAr.trim() },
      subtitle: { en: form.subtitleEn.trim(), ar: form.subtitleAr.trim() },
      displayOrder: Number(form.displayOrder) || 0,
      isActive: form.isActive,
      showOnHomepage: form.showOnHomepage,
    };
    setIsSaving(true);
    setFormError(null);
    try {
      if (formTarget === 'new') {
        await createExperienceListing({ ...values, experienceIds: [] });
        showToast(`Experience listing "${values.title.en}" created`);
      } else if (formTarget) {
        await updateExperienceListing(formTarget._id, values);
        showToast(`Experience listing "${values.title.en}" updated`);
      }
      setFormTarget(null);
      await fetchListings();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save this experience listing.');
    } finally {
      setIsSaving(false);
    }
  };

  // Shared runner for the per-card actions (delete / toggles).
  const runCardAction = async (id: string, action: () => Promise<void>, successMessage?: string) => {
    setBusyId(id);
    setActionError(null);
    try {
      await action();
      if (successMessage) showToast(successMessage);
      await fetchListings();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = (listing: ExperienceListing) => {
    if (!window.confirm(`Delete experience listing "${listing.title.en}"? It will be removed from the traveller app.`)) return;
    runCardAction(listing._id, () => deleteExperienceListing(listing._id), `Experience listing "${listing.title.en}" deleted`);
  };

  const setExperienceAssigned = async (listingId: string, experienceId: string, assigned: boolean) => {
    setMutatingExperienceId(experienceId);
    setManageError(null);
    try {
      if (assigned) {
        await addExperiencesToListing(listingId, { experienceIds: [experienceId] });
      } else {
        await removeExperiencesFromListing(listingId, { experienceIds: [experienceId] });
      }
      // Reflect immediately, then reconcile with the server.
      setListings(prev =>
        prev.map(l => {
          if (l._id !== listingId) return l;
          const ids = assigned ? Array.from(new Set([...l.experienceIds, experienceId])) : l.experienceIds.filter(x => x !== experienceId);
          return { ...l, experienceIds: ids, experienceCount: ids.length };
        }),
      );
      fetchListings();
    } catch (err) {
      setManageError(err instanceof Error ? err.message : `Failed to ${assigned ? 'add' : 'remove'} this experience.`);
    } finally {
      setMutatingExperienceId(null);
    }
  };

  const searchTerm = search.trim().toLowerCase();
  const assignedExperiences = managing ? experiences.filter(x => managing.experienceIds.includes(x._id)) : [];
  // Assigned IDs the picker can't name (outside the first 100 loaded).
  const unknownAssignedCount = managing ? managing.experienceIds.length - assignedExperiences.length : 0;
  const candidateExperiences = managing
    ? experiences.filter(x => !managing.experienceIds.includes(x._id) && (searchTerm === '' || x.title.toLowerCase().includes(searchTerm)))
    : [];

  return (
    <div className="space-y-6">
      {/* Filters + create */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text/50" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search listings..."
              className="w-full bg-surface border border-border-misrah rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-primary outline-none focus:border-accent"
            />
          </div>
          <select value={activeFilter} onChange={e => setActiveFilter(e.target.value as BoolFilter)} className={filterSelectClass}>
            <option value="all">ALL STATUSES</option>
            <option value="yes">ACTIVE</option>
            <option value="no">INACTIVE</option>
          </select>
          <select value={homepageFilter} onChange={e => setHomepageFilter(e.target.value as BoolFilter)} className={filterSelectClass}>
            <option value="all">ALL</option>
            <option value="yes">ON HOMEPAGE</option>
            <option value="no">NOT ON HOMEPAGE</option>
          </select>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary text-accent px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 group shrink-0"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Create Experience Listing
        </button>
      </div>

      {actionError && (
        <div className="bg-danger/5 border border-danger/20 rounded-3xl p-5 flex items-center gap-3 text-danger">
          <TriangleAlert size={18} />
          <p className="text-[10px] font-black uppercase tracking-widest">{actionError}</p>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-[48px] border border-border-misrah p-32 text-center shadow-sm">
          <Loader2 size={40} className="animate-spin mx-auto text-primary/30" />
        </div>
      ) : loadError ? (
        <div className="bg-danger/5 rounded-[48px] border border-danger/20 p-16 text-center shadow-sm space-y-4">
          <TriangleAlert size={40} className="mx-auto text-danger" />
          <h3 className="text-xl font-black italic text-danger uppercase">Failed To Load</h3>
          <p className="text-[10px] font-bold text-danger/70 uppercase tracking-widest">{loadError}</p>
          <button
            onClick={fetchListings}
            className="mt-4 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] bg-primary text-white hover:opacity-90 transition-all"
          >
            Retry
          </button>
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-[48px] border border-border-misrah p-24 text-center shadow-sm space-y-4">
          <LayoutList size={40} className="mx-auto text-muted-text/30" />
          <p className="text-xs font-bold text-muted-text/60 uppercase tracking-widest">No experience listings found.</p>
          <button
            onClick={openCreate}
            className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] bg-primary text-accent hover:opacity-90 transition-all inline-flex items-center gap-2"
          >
            <Plus size={14} /> Create Experience Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {listings.map(listing => {
            const count = listing.experienceCount ?? listing.experienceIds.length;
            const isBusy = busyId === listing._id;
            return (
              <div
                key={listing._id}
                className={`bg-white rounded-[36px] border border-border-misrah p-7 shadow-sm hover:shadow-luxury transition-all flex flex-col gap-5 ${!listing.isActive ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-widest text-accent">#{listing.displayOrder} · Horizontal Scroll</span>
                    <h3 className="text-lg font-black italic text-primary uppercase tracking-tight truncate mt-0.5">{listing.title.en}</h3>
                    <p className="text-xs text-muted-text truncate">{listing.subtitle.en}</p>
                  </div>
                  <div className="flex items-start gap-3 shrink-0">
                    <div className="text-right" dir="rtl">
                      <p className="text-sm font-bold text-primary font-arabic">{listing.title.ar}</p>
                      <p className="text-[10px] text-muted-text font-arabic">{listing.subtitle.ar}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => openEdit(listing)} title="Edit listing" className="p-2 rounded-lg text-muted-text hover:text-primary hover:bg-surface transition-colors">
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(listing)}
                        disabled={isBusy}
                        title="Delete listing"
                        className="p-2 rounded-lg text-muted-text hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                      >
                        {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-surface border border-border-misrah text-[9px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Sparkles size={11} /> EXPERIENCE
                  </span>
                  <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-[9px] font-black uppercase tracking-wider">
                    {count} {count === 1 ? 'Experience' : 'Experiences'}
                  </span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <button
                      onClick={() => runCardAction(listing._id, () => toggleExperienceListingHomepage(listing._id))}
                      disabled={isBusy}
                      title={listing.showOnHomepage ? 'Remove from homepage' : 'Show on homepage'}
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[2px] transition-all disabled:opacity-50 flex items-center gap-1
                        ${listing.showOnHomepage ? 'bg-primary text-accent' : 'bg-muted-text/10 text-muted-text'}`}
                    >
                      <Home size={10} /> {listing.showOnHomepage ? 'Homepage' : 'Hidden'}
                    </button>
                    <button
                      onClick={() => runCardAction(listing._id, () => toggleExperienceListingActive(listing._id))}
                      disabled={isBusy}
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[2px] transition-all disabled:opacity-50
                        ${listing.isActive ? 'bg-success/10 text-success' : 'bg-muted-text/10 text-muted-text'}`}
                    >
                      {listing.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => { setSearch(''); setManageError(null); setManagingId(listing._id); }}
                  className="mt-auto w-full py-3 rounded-2xl border border-border-misrah hover:border-accent text-[10px] font-black uppercase tracking-[2px] text-primary transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={14} className="text-accent" /> Manage Experiences
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit modal */}
      <AnimatePresence>
        {formTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFormTarget(null)} className="absolute inset-0 bg-primary/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[36px] w-full max-w-xl relative z-10 p-8 shadow-luxury max-h-[90vh] overflow-y-auto space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border-misrah">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-accent/20 text-accent"><Sparkles size={16} /></span>
                    <h2 className="text-xl font-black italic text-primary uppercase">
                      {formTarget === 'new' ? 'New Experience Listing' : 'Edit Experience Listing'}
                    </h2>
                  </div>
                  <p className="text-xs text-muted-text font-bold mt-1">Home page section of experiences in the traveller app</p>
                </div>
                <button type="button" onClick={() => setFormTarget(null)} className="w-8 h-8 rounded-full bg-surface hover:bg-border-misrah flex items-center justify-center text-primary cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Title (English) *</label>
                    <input value={form.titleEn} onChange={e => setForm({ ...form, titleEn: e.target.value })} placeholder="e.g. Local Discoveries" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Title (Arabic) *</label>
                    <input value={form.titleAr} onChange={e => setForm({ ...form, titleAr: e.target.value })} placeholder="الاكتشافات المحلية" dir="rtl" className={`${inputClass} font-arabic`} />
                  </div>
                  <div>
                    <label className={labelClass}>Subtitle (English) *</label>
                    <input value={form.subtitleEn} onChange={e => setForm({ ...form, subtitleEn: e.target.value })} placeholder="e.g. Trending in UAE" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Subtitle (Arabic) *</label>
                    <input value={form.subtitleAr} onChange={e => setForm({ ...form, subtitleAr: e.target.value })} placeholder="الأكثر رواجاً في الإمارات" dir="rtl" className={`${inputClass} font-arabic`} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Display Order</label>
                  <input type="number" min={0} value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: Number(e.target.value) })} className={inputClass} />
                </div>

                <label className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border-misrah cursor-pointer">
                  <div>
                    <span className="text-xs font-black uppercase text-primary">Active</span>
                    <p className="text-[10px] text-muted-text font-bold">Inactive sections are hidden from the traveller app</p>
                  </div>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-accent" />
                </label>

                <label className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border-misrah cursor-pointer">
                  <div>
                    <span className="text-xs font-black uppercase text-primary">Show On Homepage</span>
                    <p className="text-[10px] text-muted-text font-bold">Feature this section on the traveller home screen</p>
                  </div>
                  <input type="checkbox" checked={form.showOnHomepage} onChange={e => setForm({ ...form, showOnHomepage: e.target.checked })} className="w-4 h-4 accent-accent" />
                </label>

                {formError && <p className="text-[10px] font-black text-danger uppercase tracking-widest text-center">{formError}</p>}

                <div className="flex gap-3 pt-3 border-t border-border-misrah">
                  <button type="button" onClick={() => setFormTarget(null)} className="flex-1 py-3.5 rounded-2xl border border-border-misrah text-xs font-black uppercase tracking-wider text-primary hover:bg-surface cursor-pointer">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-[2] py-3.5 bg-primary text-accent rounded-2xl text-xs font-black uppercase tracking-wider hover:opacity-95 shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving && <Loader2 size={14} className="animate-spin" />}
                    {formTarget === 'new' ? 'Create Experience Listing' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage experiences modal */}
      <AnimatePresence>
        {managing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setManagingId(null)} className="absolute inset-0 bg-primary/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[48px] w-full max-w-2xl relative z-10 p-10 max-h-[85vh] flex flex-col">
              <button onClick={() => setManagingId(null)} className="absolute top-8 right-8 text-muted-text"><X size={24} /></button>
              <h2 className="text-2xl font-black italic text-primary uppercase mb-1">{managing.title.en}</h2>
              <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-widest mb-8">Manage Experiences In This Listing</p>

              {manageError && (
                <div className="bg-danger/5 border border-danger/20 rounded-2xl p-4 flex items-center gap-3 text-danger mb-4">
                  <TriangleAlert size={16} />
                  <p className="text-[10px] font-black uppercase tracking-widest">{manageError}</p>
                </div>
              )}

              {isLoadingExperiences ? (
                <div className="flex-1 flex items-center justify-center py-16">
                  <Loader2 size={32} className="animate-spin text-primary/30" />
                </div>
              ) : experiencesError ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <TriangleAlert size={32} className="text-danger" />
                  <p className="text-[10px] font-bold text-danger/70 uppercase tracking-widest">{experiencesError}</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-8 pr-1">
                  <div className="space-y-3">
                    <h3 className="text-[11px] font-black italic text-primary/40 uppercase tracking-[2.5px]">Assigned ({managing.experienceIds.length})</h3>
                    {assignedExperiences.length === 0 && unknownAssignedCount === 0 ? (
                      <p className="text-[10px] font-bold text-muted-text/50 uppercase tracking-widest px-1">No experiences assigned yet</p>
                    ) : (
                      <div className="space-y-2">
                        {assignedExperiences.map(x => (
                          <div key={x._id} className="flex items-center justify-between bg-surface rounded-2xl px-5 py-3">
                            <span className="text-xs font-bold text-primary truncate">{x.title}</span>
                            <button
                              onClick={() => setExperienceAssigned(managing._id, x._id, false)}
                              disabled={mutatingExperienceId === x._id}
                              className="w-8 h-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center hover:bg-danger hover:text-white transition-all shrink-0 disabled:opacity-50"
                            >
                              {mutatingExperienceId === x._id ? <Loader2 size={14} className="animate-spin" /> : <Minus size={14} />}
                            </button>
                          </div>
                        ))}
                        {unknownAssignedCount > 0 && (
                          <p className="text-[10px] font-bold text-muted-text/60 px-1">
                            + {unknownAssignedCount} more not in the first 100 loaded experiences
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[11px] font-black italic text-primary/40 uppercase tracking-[2.5px]">Add Experiences</h3>
                    <div className="relative">
                      <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-text/50" />
                      <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by experience title..."
                        className="w-full bg-surface border border-border-misrah rounded-2xl pl-12 pr-5 py-3 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {candidateExperiences.length === 0 ? (
                        <p className="text-[10px] font-bold text-muted-text/50 uppercase tracking-widest px-1">No matching experiences</p>
                      ) : (
                        candidateExperiences.map(x => (
                          <div key={x._id} className="flex items-center justify-between bg-surface rounded-2xl px-5 py-3">
                            <span className="text-xs font-bold text-primary truncate">{x.title}</span>
                            <button
                              onClick={() => setExperienceAssigned(managing._id, x._id, true)}
                              disabled={mutatingExperienceId === x._id}
                              className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center hover:bg-success hover:text-white transition-all shrink-0 disabled:opacity-50"
                            >
                              {mutatingExperienceId === x._id ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-[200] max-w-sm bg-[#0B0D14] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-accent/30 flex items-center gap-3"
          >
            <CheckCircle2 size={18} className="text-accent shrink-0" />
            <span className="text-xs font-bold text-white/90">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
