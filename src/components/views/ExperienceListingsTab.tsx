import React, { useEffect, useState } from 'react';
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
  AlertCircle,
} from 'lucide-react';
import { listAdminExperiences } from '../../features/experiences/api';
import type { ApiExperienceListItem } from '../../features/experiences/types';

// Experience Listings — home page sections of experiences, mirroring Asset
// Listings (Assets Queue → Asset Listings). UI ONLY: the backend's
// /home-page-listings has no EXPERIENCE catalogue type and no route to attach
// experiences, so sections live in local state and reset on reload. Only the
// experience picker reads real data (GET /admin/experiences).

interface ExperienceListing {
  id: string;
  title: { en: string; ar: string };
  subtitle: { en: string; ar: string };
  displayOrder: number;
  isActive: boolean;
  experienceIds: string[];
}

interface ListingFormState {
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  displayOrder: number;
  isActive: boolean;
}

const inputClass = 'w-full bg-surface border border-border-misrah rounded-xl px-4 py-3 text-xs font-bold text-primary outline-none focus:border-accent';
const labelClass = 'text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1';

export const ExperienceListingsTab = () => {
  const [listings, setListings] = useState<ExperienceListing[]>([]);
  const [formTarget, setFormTarget] = useState<ExperienceListing | 'new' | null>(null);
  const [form, setForm] = useState<ListingFormState>({ titleEn: '', titleAr: '', subtitleEn: '', subtitleAr: '', displayOrder: 1, isActive: true });
  const [formError, setFormError] = useState<string | null>(null);
  const [managingId, setManagingId] = useState<string | null>(null);

  // Real experiences for the picker (read-only).
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
    listAdminExperiences({ page: 1, limit: 100 })
      .then(res => setExperiences(res.data))
      .catch(err => setExperiencesError(err?.message || 'Failed to load experiences.'))
      .finally(() => setIsLoadingExperiences(false));
  }, []);

  const sortedListings = [...listings].sort((a, b) => a.displayOrder - b.displayOrder);
  const managing = listings.find(l => l.id === managingId) ?? null;

  const openCreate = () => {
    const maxOrder = listings.reduce((max, l) => Math.max(max, l.displayOrder), 0);
    setForm({ titleEn: '', titleAr: '', subtitleEn: '', subtitleAr: '', displayOrder: maxOrder + 1, isActive: true });
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
    });
    setFormError(null);
    setFormTarget(listing);
  };

  const handleSave = (e: React.FormEvent) => {
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
    };
    if (formTarget === 'new') {
      setListings(prev => [...prev, { id: `local-${Date.now()}`, experienceIds: [], ...values }]);
      showToast(`Experience listing "${values.title.en}" created (not saved)`);
    } else if (formTarget) {
      const id = formTarget.id;
      setListings(prev => prev.map(l => (l.id === id ? { ...l, ...values } : l)));
      showToast(`Experience listing "${values.title.en}" updated (not saved)`);
    }
    setFormTarget(null);
  };

  const handleDelete = (listing: ExperienceListing) => {
    if (!window.confirm(`Delete experience listing "${listing.title.en}"?`)) return;
    setListings(prev => prev.filter(l => l.id !== listing.id));
    showToast(`Experience listing "${listing.title.en}" deleted`);
  };

  const toggleActive = (id: string) => {
    setListings(prev => prev.map(l => (l.id === id ? { ...l, isActive: !l.isActive } : l)));
  };

  const setExperienceAssigned = (listingId: string, experienceId: string, assigned: boolean) => {
    setListings(prev =>
      prev.map(l => {
        if (l.id !== listingId) return l;
        const ids = assigned ? [...l.experienceIds, experienceId] : l.experienceIds.filter(x => x !== experienceId);
        return { ...l, experienceIds: Array.from(new Set(ids)) };
      }),
    );
  };

  const searchTerm = search.trim().toLowerCase();
  const assignedExperiences = managing ? experiences.filter(x => managing.experienceIds.includes(x._id)) : [];
  const candidateExperiences = managing
    ? experiences.filter(x => !managing.experienceIds.includes(x._id) && (searchTerm === '' || x.title.toLowerCase().includes(searchTerm)))
    : [];

  return (
    <div className="space-y-6">
      {/* Not-connected notice */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
          Preview only — experience listings aren't supported by the API yet. Sections you create here aren't saved and will be
          lost when you leave the page.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-[10px] font-black text-muted-text uppercase tracking-[2px]">
          {listings.length} home page {listings.length === 1 ? 'section' : 'sections'}
        </p>
        <button
          onClick={openCreate}
          className="bg-primary text-accent px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 group"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Create Experience Listing
        </button>
      </div>

      {sortedListings.length === 0 ? (
        <div className="bg-white rounded-[48px] border border-border-misrah p-24 text-center shadow-sm space-y-4">
          <LayoutList size={40} className="mx-auto text-muted-text/30" />
          <p className="text-xs font-bold text-muted-text/60 uppercase tracking-widest">No experience listings yet.</p>
          <button
            onClick={openCreate}
            className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] bg-primary text-accent hover:opacity-90 transition-all inline-flex items-center gap-2"
          >
            <Plus size={14} /> Create Experience Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedListings.map(listing => (
            <div
              key={listing.id}
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
                    <button onClick={() => handleDelete(listing)} title="Delete listing" className="p-2 rounded-lg text-muted-text hover:text-danger hover:bg-danger/10 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-surface border border-border-misrah text-[9px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Sparkles size={11} /> EXPERIENCE
                </span>
                <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-[9px] font-black uppercase tracking-wider">
                  {listing.experienceIds.length} {listing.experienceIds.length === 1 ? 'Experience' : 'Experiences'}
                </span>
                <button
                  onClick={() => toggleActive(listing.id)}
                  className={`ml-auto px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[2px] transition-all
                    ${listing.isActive ? 'bg-success/10 text-success' : 'bg-muted-text/10 text-muted-text'}`}
                >
                  {listing.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>

              <button
                onClick={() => { setSearch(''); setManagingId(listing.id); }}
                className="mt-auto w-full py-3 rounded-2xl border border-border-misrah hover:border-accent text-[10px] font-black uppercase tracking-[2px] text-primary transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} className="text-accent" /> Manage Experiences
              </button>
            </div>
          ))}
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
                    <input value={form.titleEn} onChange={e => setForm({ ...form, titleEn: e.target.value })} placeholder="e.g. Desert Adventures" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Title (Arabic) *</label>
                    <input value={form.titleAr} onChange={e => setForm({ ...form, titleAr: e.target.value })} placeholder="مغامرات الصحراء" dir="rtl" className={`${inputClass} font-arabic`} />
                  </div>
                  <div>
                    <label className={labelClass}>Subtitle (English) *</label>
                    <input value={form.subtitleEn} onChange={e => setForm({ ...form, subtitleEn: e.target.value })} placeholder="e.g. Curated dune escapes" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Subtitle (Arabic) *</label>
                    <input value={form.subtitleAr} onChange={e => setForm({ ...form, subtitleAr: e.target.value })} placeholder="رحلات مختارة في الكثبان" dir="rtl" className={`${inputClass} font-arabic`} />
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

                {formError && <p className="text-[10px] font-black text-danger uppercase tracking-widest text-center">{formError}</p>}

                <div className="flex gap-3 pt-3 border-t border-border-misrah">
                  <button type="button" onClick={() => setFormTarget(null)} className="flex-1 py-3.5 rounded-2xl border border-border-misrah text-xs font-black uppercase tracking-wider text-primary hover:bg-surface cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" className="flex-[2] py-3.5 bg-primary text-accent rounded-2xl text-xs font-black uppercase tracking-wider hover:opacity-95 shadow-md cursor-pointer">
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
                    <h3 className="text-[11px] font-black italic text-primary/40 uppercase tracking-[2.5px]">Assigned ({assignedExperiences.length})</h3>
                    {assignedExperiences.length === 0 ? (
                      <p className="text-[10px] font-bold text-muted-text/50 uppercase tracking-widest px-1">No experiences assigned yet</p>
                    ) : (
                      <div className="space-y-2">
                        {assignedExperiences.map(x => (
                          <div key={x._id} className="flex items-center justify-between bg-surface rounded-2xl px-5 py-3">
                            <span className="text-xs font-bold text-primary truncate">{x.title}</span>
                            <button
                              onClick={() => setExperienceAssigned(managing.id, x._id, false)}
                              className="w-8 h-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center hover:bg-danger hover:text-white transition-all shrink-0"
                            >
                              <Minus size={14} />
                            </button>
                          </div>
                        ))}
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
                              onClick={() => setExperienceAssigned(managing.id, x._id, true)}
                              className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center hover:bg-success hover:text-white transition-all shrink-0"
                            >
                              <Plus size={14} />
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
