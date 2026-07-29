import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit, Trash2, Upload, X, Loader2, TriangleAlert, Users2, ImageOff } from 'lucide-react';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryActive,
} from '../../../features/categories/api';
import { uploadFile } from '../../../features/properties/api';
import type { ApiCategory } from '../../../features/categories/types';
import { ManageCategoryPropertiesModal } from './ManageCategoryPropertiesModal';

// Confirmed from misra-api-nest/src/database/seeds/property-category.seeder.ts:
// every real seeded category's iconName is a lowercase, hyphenated slug of
// name.en ('City' -> 'city', 'Beach' -> 'beach'). Derived automatically from
// the English name at save time — no manual entry. See API_INTEGRATION.md →
// "Categories" for why this is a convention match rather than an enforced
// contract (no backend validation beyond non-empty string; presumably an
// icon-asset lookup key on the mobile side).
function slugifyIconName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

interface CategoryFormState {
  nameEn: string;
  nameAr: string;
  iconUrl: string;
}

const EMPTY_FORM: CategoryFormState = { nameEn: '', nameAr: '', iconUrl: '' };

export const CategoriesModule = () => {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ApiCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormState>(EMPTY_FORM);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [managingCategory, setManagingCategory] = useState<ApiCategory | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await listCategories();
      setCategories(result);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load categories.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddItem = () => {
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setSaveError(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: ApiCategory) => {
    setEditingItem(item);
    setFormData({ nameEn: item.name.en, nameAr: item.name.ar, iconUrl: item.iconUrl ?? '' });
    setSaveError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Purge this category node?')) return;
    setDeletingId(id);
    setActionError(null);
    try {
      await deleteCategory(id);
      await fetchCategories();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete this category.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (id: string) => {
    setTogglingId(id);
    setActionError(null);
    try {
      const updated = await toggleCategoryActive(id);
      setCategories(prev => prev.map(c => (c._id === id ? updated : c)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to toggle this category.');
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
      setFormData(prev => ({ ...prev, iconUrl: uploaded.url }));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nameEn.trim() || !formData.nameAr.trim()) {
      setSaveError('English and Arabic names are both required.');
      return;
    }
    const iconName = slugifyIconName(formData.nameEn);
    if (!iconName) {
      setSaveError('English name must contain at least one letter or number.');
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      if (editingItem) {
        await updateCategory(editingItem._id, {
          name: { en: formData.nameEn.trim(), ar: formData.nameAr.trim() },
          iconName,
          iconUrl: formData.iconUrl || undefined,
        });
      } else {
        await createCategory({
          name: { en: formData.nameEn.trim(), ar: formData.nameAr.trim() },
          iconName,
          iconUrl: formData.iconUrl || undefined,
          displayOrder: categories.length,
          isActive: true,
        });
      }
      await fetchCategories();
      setIsModalOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save this category.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-sans font-black italic text-primary uppercase tracking-tighter leading-none">Asset Categories</h1>
          <p className="text-muted-text text-[10px] font-black uppercase tracking-[3px] mt-2 opacity-60">Classification Framework & Inventory Grouping</p>
        </div>
        <button
          onClick={handleAddItem}
          className="bg-primary text-accent px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 group"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Register Category
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
            onClick={fetchCategories}
            className="mt-4 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] bg-primary text-white hover:opacity-90 transition-all"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <AnimatePresence mode="popLayout">
            {categories.map(cat => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={cat._id}
                className={`bg-white rounded-[40px] border border-border-misrah p-8 shadow-sm hover:shadow-luxury transition-all group text-center flex flex-col items-center ${!cat.isActive ? 'opacity-50' : ''}`}
              >
                <div className="w-24 h-24 rounded-full border-8 border-surface overflow-hidden mb-6 shadow-inner relative group-hover:scale-110 transition-transform duration-500 flex items-center justify-center bg-surface">
                  {cat.iconUrl ? (
                    <img src={cat.iconUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={cat.name.en} />
                  ) : (
                    <ImageOff size={28} className="text-muted-text/30" />
                  )}
                  <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-base font-sans font-black italic text-primary uppercase tracking-tight">{cat.name.en}</h3>
                <p className="text-[10px] font-black text-accent mt-2 tracking-widest uppercase">{cat.propertyIds.length} GLOBAL PROPERTIES</p>

                <button
                  onClick={() => handleToggleActive(cat._id)}
                  disabled={togglingId === cat._id}
                  className={`mt-4 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[2px] transition-all disabled:opacity-50 flex items-center gap-1.5
                    ${cat.isActive ? 'bg-success/10 text-success' : 'bg-muted-text/10 text-muted-text'}`}
                >
                  {togglingId === cat._id && <Loader2 size={10} className="animate-spin" />}
                  {cat.isActive ? 'Active' : 'Inactive'}
                </button>

                <div className="flex gap-2 mt-6 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  <button
                    onClick={() => setManagingCategory(cat)}
                    title="Manage properties in this category"
                    className="p-3 rounded-xl bg-surface text-muted-text hover:text-primary hover:bg-white border border-transparent hover:border-border-misrah transition-all shadow-sm"
                  >
                    <Users2 size={14} />
                  </button>
                  <button
                    onClick={() => handleEditItem(cat)}
                    className="p-3 rounded-xl bg-surface text-muted-text hover:text-primary hover:bg-white border border-transparent hover:border-border-misrah transition-all shadow-sm"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat._id)}
                    disabled={deletingId === cat._id}
                    className="p-3 rounded-xl bg-danger/5 text-danger hover:bg-danger hover:text-white transition-all shadow-sm disabled:opacity-50"
                  >
                    {deletingId === cat._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
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
              <h2 className="text-2xl font-black italic text-primary uppercase mb-8">{editingItem ? 'Update' : 'New'} Category</h2>
              <div className="space-y-6">
                <div onClick={() => photoInputRef.current?.click()} className="h-40 rounded-3xl border-2 border-dashed border-border-misrah flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group">
                  {isUploading ? (
                    <Loader2 className="animate-spin text-[#D4C3B5]" />
                  ) : formData.iconUrl ? (
                    <img src={formData.iconUrl} className="w-full h-full object-cover opacity-50" alt="Preview" />
                  ) : (
                    <Upload className="text-[#D4C3B5] mb-2" />
                  )}
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#D4C3B5] relative z-10">Upload Category Icon</span>
                  <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[2px] text-muted-text px-1">Category Name (English)</label>
                  <input
                    value={formData.nameEn}
                    onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
                    placeholder="e.g. City"
                    className="w-full bg-surface border border-border-misrah rounded-2xl px-6 py-4 text-xs font-bold"
                  />
                  <p className="text-[9px] font-bold text-muted-text/50 uppercase tracking-widest px-1">
                    This also becomes the icon lookup key on mobile (e.g. "City" → "city").
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[2px] text-muted-text px-1">Category Name (Arabic)</label>
                  <input
                    value={formData.nameAr}
                    onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
                    placeholder="مدينة"
                    dir="rtl"
                    className="w-full bg-surface border border-border-misrah rounded-2xl px-6 py-4 text-xs font-bold"
                  />
                </div>

                {saveError && (
                  <p className="text-[10px] font-black text-danger uppercase tracking-widest text-center">{saveError}</p>
                )}

                <button
                  onClick={handleSave}
                  disabled={isSaving || isUploading}
                  className="w-full py-5 bg-primary text-accent rounded-3xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 size={14} className="animate-spin" />}
                  Finalize Category
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {managingCategory && (
        <ManageCategoryPropertiesModal
          category={managingCategory}
          onClose={() => setManagingCategory(null)}
          onUpdated={(updated) => {
            setCategories(prev => prev.map(c => (c._id === updated._id ? updated : c)));
            setManagingCategory(updated);
          }}
        />
      )}
    </div>
  );
};
