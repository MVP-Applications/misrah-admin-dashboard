import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, Loader2, LayoutList } from 'lucide-react';
import { createHomePageListing, listHomePageListingsAdmin, updateHomePageListing } from '../../../features/homePageListings/api';
import type { AdminHomePageListing, CatalogueType, DisplayType } from '../../../features/homePageListings/types';

// Not user-selectable — every section is sent as a horizontal scroll row.
const DISPLAY_TYPE: DisplayType = 'HORIZONTAL_SCROLL';

const CATALOGUE_TYPES: { value: CatalogueType; label: string }[] = [
  { value: 'PROPERTY', label: 'Properties' },
  { value: 'HOST', label: 'Hosts' },
  { value: 'NONE', label: 'None' },
];

interface CreateAssetListingModalProps {
  // Present = edit mode (PATCH), absent = create mode (POST).
  listing?: AdminHomePageListing;
  onClose: () => void;
  // Create passes the created listing; edit passes the edited one's form values.
  onSaved: (title: string) => void;
}

// POST /home-page-listings — a home page section (e.g. "Local Discoveries")
// that the traveller app renders. Properties/hosts are attached to it
// afterwards; this only creates the section itself.
export const CreateAssetListingModal = ({ listing, onClose, onSaved }: CreateAssetListingModalProps) => {
  const isEdit = Boolean(listing);
  const [titleEn, setTitleEn] = useState(listing?.title.en ?? '');
  const [titleAr, setTitleAr] = useState(listing?.title.ar ?? '');
  const [subtitleEn, setSubtitleEn] = useState(listing?.subtitle.en ?? '');
  const [subtitleAr, setSubtitleAr] = useState(listing?.subtitle.ar ?? '');
  const [catalogueType, setCatalogueType] = useState<CatalogueType>(listing?.catalogueType ?? 'PROPERTY');
  const [displayOrder, setDisplayOrder] = useState(listing?.displayOrder ?? 1);
  const [isActive, setIsActive] = useState(listing?.isActive ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default the order to "after the last existing section" (create only).
  useEffect(() => {
    if (isEdit) return;
    listHomePageListingsAdmin()
      .then(list => {
        const maxOrder = list.reduce((max, l) => Math.max(max, l.displayOrder ?? 0), 0);
        setDisplayOrder(maxOrder + 1);
      })
      .catch(() => { /* keep the default of 1 */ });
  }, [isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim() || !titleAr.trim() || !subtitleEn.trim() || !subtitleAr.trim()) {
      setError('Title and subtitle are required in both English and Arabic.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        title: { en: titleEn.trim(), ar: titleAr.trim() },
        subtitle: { en: subtitleEn.trim(), ar: subtitleAr.trim() },
        displayType: DISPLAY_TYPE,
        catalogueType,
        displayOrder: Number(displayOrder) || 0,
        isActive,
      };
      if (listing) {
        await updateHomePageListing(listing._id, payload);
        onSaved(payload.title.en);
      } else {
        const created = await createHomePageListing(payload);
        onSaved(created.title.en);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEdit ? 'update' : 'create'} asset listing.`);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = 'w-full bg-surface border border-border-misrah rounded-xl px-4 py-3 text-xs font-bold text-primary outline-none focus:border-accent';
  const labelClass = 'text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[36px] w-full max-w-xl relative z-10 p-8 shadow-luxury max-h-[90vh] overflow-y-auto space-y-6"
      >
        <div className="flex items-center justify-between pb-4 border-b border-border-misrah">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-accent/20 text-accent">
                <LayoutList size={16} />
              </span>
              <h2 className="text-xl font-black italic text-primary uppercase">{isEdit ? 'Edit Asset Listing' : 'New Asset Listing'}</h2>
            </div>
            <p className="text-xs text-muted-text font-bold mt-1">Home page section shown in the traveller app</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface hover:bg-border-misrah flex items-center justify-center text-primary cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Title (English) *</label>
              <input value={titleEn} onChange={e => setTitleEn(e.target.value)} placeholder="e.g. Local Discoveries" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Title (Arabic) *</label>
              <input value={titleAr} onChange={e => setTitleAr(e.target.value)} placeholder="الاكتشافات المحلية" dir="rtl" className={`${inputClass} font-arabic`} />
            </div>
            <div>
              <label className={labelClass}>Subtitle (English) *</label>
              <input value={subtitleEn} onChange={e => setSubtitleEn(e.target.value)} placeholder="e.g. Gems in City Retreats" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Subtitle (Arabic) *</label>
              <input value={subtitleAr} onChange={e => setSubtitleAr(e.target.value)} placeholder="جواهر في ملاجئ المدينة" dir="rtl" className={`${inputClass} font-arabic`} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Catalogue Type</label>
              <select value={catalogueType} onChange={e => setCatalogueType(e.target.value as CatalogueType)} className={`${inputClass} cursor-pointer`}>
                {CATALOGUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Display Order</label>
              <input type="number" min={0} value={displayOrder} onChange={e => setDisplayOrder(Number(e.target.value))} className={inputClass} />
            </div>
          </div>

          <label className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border-misrah cursor-pointer">
            <div>
              <span className="text-xs font-black uppercase text-primary">Active</span>
              <p className="text-[10px] text-muted-text font-bold">Inactive sections are hidden from the traveller app</p>
            </div>
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 accent-accent" />
          </label>

          {error && (
            <p className="text-[10px] font-black text-danger uppercase tracking-widest text-center">{error}</p>
          )}

          <div className="flex gap-3 pt-3 border-t border-border-misrah">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl border border-border-misrah text-xs font-black uppercase tracking-wider text-primary hover:bg-surface cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-[2] py-3.5 bg-primary text-accent rounded-2xl text-xs font-black uppercase tracking-wider hover:opacity-95 shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Asset Listing'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
