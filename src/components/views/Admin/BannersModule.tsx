import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit, Trash2, Upload, X, Loader2, TriangleAlert } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { listBanners, createBanner, updateBanner, deleteBanner, toggleBannerActive } from '../../../features/banners/api';
import { uploadFile } from '../../../features/properties/api';
import type { ApiBanner } from '../../../features/banners/types';

interface BannerFormState {
  titleEn: string;
  titleAr: string;
  link: string;
  imageUrl: string;
}

const EMPTY_FORM: BannerFormState = { titleEn: '', titleAr: '', link: '', imageUrl: '' };

export const BannersModule = () => {
  const [banners, setBanners] = useState<ApiBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ApiBanner | null>(null);
  const [formData, setFormData] = useState<BannerFormState>(EMPTY_FORM);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchBanners = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await listBanners();
      setBanners(result);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load banners.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleAddItem = () => {
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setSaveError(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: ApiBanner) => {
    setEditingItem(item);
    setFormData({ titleEn: item.title.en, titleAr: item.title.ar, link: item.link, imageUrl: item.imageUrl });
    setSaveError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Erase this marketing node?')) return;
    setDeletingId(id);
    setActionError(null);
    try {
      await deleteBanner(id);
      await fetchBanners();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete this banner.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (id: string) => {
    setTogglingId(id);
    setActionError(null);
    try {
      const updated = await toggleBannerActive(id);
      setBanners(prev => prev.map(b => (b._id === id ? updated : b)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to toggle this banner.');
    } finally {
      setTogglingId(null);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setSaveError(null);
    try {
      const uploaded = await uploadFile(file);
      setFormData(prev => ({ ...prev, imageUrl: uploaded.url }));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.titleEn.trim() || !formData.titleAr.trim()) {
      setSaveError('English and Arabic titles are both required.');
      return;
    }
    if (!formData.imageUrl) {
      setSaveError('A banner image is required.');
      return;
    }
    if (!formData.link.trim()) {
      setSaveError('A redirect link is required.');
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      if (editingItem) {
        await updateBanner(editingItem._id, {
          title: { en: formData.titleEn.trim(), ar: formData.titleAr.trim() },
          link: formData.link.trim(),
          imageUrl: formData.imageUrl,
        });
      } else {
        await createBanner({
          title: { en: formData.titleEn.trim(), ar: formData.titleAr.trim() },
          link: formData.link.trim(),
          imageUrl: formData.imageUrl,
          displayOrder: banners.length,
          isActive: true,
        });
      }
      await fetchBanners();
      setIsModalOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save this banner.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-sans font-black italic text-primary uppercase tracking-tighter leading-none">Marketing Banners</h1>
          <p className="text-muted-text text-[10px] font-black uppercase tracking-[3px] mt-2 opacity-60">Global Promotional Surfaces & Direct Action Links</p>
        </div>
        <button
          onClick={handleAddItem}
          className="bg-primary text-accent px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 group"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Register Banner
        </button>
      </header>

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
            onClick={fetchBanners}
            className="mt-4 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] bg-primary text-white hover:opacity-90 transition-all"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <AnimatePresence mode="popLayout">
            {banners.map(banner => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={banner._id}
                className="bg-white rounded-[40px] border border-border-misrah overflow-hidden shadow-sm group hover:shadow-luxury transition-all duration-500"
              >
                <div className="h-52 relative overflow-hidden bg-surface">
                  <img src={banner.imageUrl} alt={banner.title.en} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-6 right-6">
                    <Badge variant={banner.isActive ? 'primary' : 'gray'}>{banner.isActive ? 'Active Node' : 'Draft Mode'}</Badge>
                  </div>
                  <div className="absolute inset-0 bg-linear-to-t from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-8">
                  <div className="mb-8">
                    <p className="text-[9px] font-black text-accent uppercase tracking-[4px] mb-2 italic flex items-center gap-2">
                      <span className="w-1 h-1 bg-accent rounded-full"></span>
                      Marketing Node
                    </p>
                    <h3 className="text-lg font-sans font-black italic text-primary uppercase tracking-tight truncate mb-1">{banner.title.en}</h3>
                    <p className="text-[10px] font-bold text-muted-text/60 truncate uppercase tracking-widest">{banner.link}</p>
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-border-misrah/50 group-hover:border-accent/20 transition-all">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditItem(banner)}
                        className="p-3 rounded-xl bg-surface text-muted-text hover:text-primary transition-all border border-transparent hover:border-border-misrah shadow-sm"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(banner._id)}
                        disabled={deletingId === banner._id}
                        className="p-3 rounded-xl bg-danger/5 text-danger hover:bg-danger hover:text-white transition-all shadow-sm disabled:opacity-50"
                      >
                        {deletingId === banner._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                    <button
                      onClick={() => handleToggleActive(banner._id)}
                      disabled={togglingId === banner._id}
                      className={`text-[9px] font-black uppercase tracking-[3px] px-6 py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-2
                        ${banner.isActive
                          ? 'bg-primary text-accent hover:opacity-90'
                          : 'bg-surface text-muted-text hover:bg-primary hover:text-white'}`}
                    >
                      {togglingId === banner._id && <Loader2 size={12} className="animate-spin" />}
                      {banner.isActive ? 'Offline' : 'Deploy'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-primary/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[48px] w-full max-w-lg relative z-10 p-10 max-h-[90vh] overflow-y-auto">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-muted-text"><X size={24} /></button>
              <h2 className="text-2xl font-black italic text-primary uppercase mb-8">{editingItem ? 'Update' : 'New'} Banner</h2>
              <div className="space-y-6">
                <div onClick={() => photoInputRef.current?.click()} className="h-44 rounded-3xl border-2 border-dashed border-border-misrah flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group">
                  {isUploading ? (
                    <Loader2 className="animate-spin text-[#D4C3B5]" />
                  ) : formData.imageUrl ? (
                    <img src={formData.imageUrl} className="w-full h-full object-cover opacity-50" alt="Preview" />
                  ) : (
                    <Upload className="text-[#D4C3B5]" />
                  )}
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#D4C3B5] relative z-10">Upload Banner Creative</span>
                  <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </div>
                <input
                  value={formData.titleEn}
                  onChange={e => setFormData({ ...formData, titleEn: e.target.value })}
                  placeholder="Creative Title (English)"
                  className="w-full bg-surface border border-border-misrah rounded-2xl px-6 py-4 text-xs font-bold"
                />
                <input
                  value={formData.titleAr}
                  onChange={e => setFormData({ ...formData, titleAr: e.target.value })}
                  placeholder="Creative Title (Arabic)"
                  dir="rtl"
                  className="w-full bg-surface border border-border-misrah rounded-2xl px-6 py-4 text-xs font-bold"
                />
                <input
                  value={formData.link}
                  onChange={e => setFormData({ ...formData, link: e.target.value })}
                  placeholder="Action Redirect (e.g., /promo/summer)"
                  className="w-full bg-surface border border-border-misrah rounded-2xl px-6 py-4 text-xs font-bold"
                />

                {saveError && (
                  <p className="text-[10px] font-black text-danger uppercase tracking-widest text-center">{saveError}</p>
                )}

                <button
                  onClick={handleSave}
                  disabled={isSaving || isUploading}
                  className="w-full py-5 bg-primary text-accent rounded-3xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 size={14} className="animate-spin" />}
                  Deploy Creative
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
