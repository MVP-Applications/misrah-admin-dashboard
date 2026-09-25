import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit, Trash2, Upload, X, Loader2, TriangleAlert, ImageOff, Sparkles, Eye, EyeOff } from 'lucide-react';
import {
  listExperienceCategoriesAdmin,
  createExperienceCategory,
  updateExperienceCategory,
  deleteExperienceCategory,
} from '../../../features/experienceCategories/api';
import { uploadFile } from '../../../features/properties/api';
import { listAdminCreatedExperiences } from '../../../features/experiences/api';
import type { ApiExperienceCategoryRecord } from '../../../features/experienceCategories/types';

// Same slug convention as property categories' iconName (see CategoriesModule).
// Used as the default icon name when none is typed.
// Same preset row as misrah-retreats-admin's experience category form.
const PRESET_EMOJIS = ['🍽️', '🌊', '⛺', '🧘', '🎨', '🎾', '📷', '🏺', '👑', '🏇', '🚁', '🏎️', '⛵', '🏌️', '🎣', '✨'];

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

interface ExperienceCategoryFormState {
  nameEn: string;
  nameAr: string;
  iconName: string;
  iconUrl: string;
  displayOrder: number;
}

const EMPTY_FORM: ExperienceCategoryFormState = { nameEn: '', nameAr: '', iconName: '✨', iconUrl: '', displayOrder: 0 };

interface ExperienceCategoriesTabProps {
  // Lets the parent header's "Register" button open this tab's create modal.
  createRequest: number;
  onCountChange?: (count: number) => void;
}

export const ExperienceCategoriesTab = ({ createRequest, onCountChange }: ExperienceCategoriesTabProps) => {
  const [categories, setCategories] = useState<ApiExperienceCategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ApiExperienceCategoryRecord | null>(null);
  const [formData, setFormData] = useState<ExperienceCategoryFormState>(EMPTY_FORM);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  // categoryId → number of admin-created template experiences in it.
  const [templateCounts, setTemplateCounts] = useState<Record<string, number>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await listExperienceCategoriesAdmin({ page: 1, limit: 100 });
      const sorted = [...result].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      setCategories(sorted);
      onCountChange?.(sorted.length);
      // "Template Activities" = admin-created template experiences per
      // category (GET /experience/admin-created?categoryId). A failed count
      // just leaves that card's badge at "—".
      Promise.all(
        sorted.map(cat =>
          listAdminCreatedExperiences({ categoryId: cat._id, limit: 1 })
            .then(r => [cat._id, r.meta.total] as const)
            .catch(() => null),
        ),
      ).then(results => {
        const counts: Record<string, number> = {};
        results.forEach(r => { if (r) counts[r[0]] = r[1]; });
        setTemplateCounts(counts);
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load experience categories.');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddItem = () => {
    setEditingItem(null);
    setFormData({ ...EMPTY_FORM, displayOrder: categories.length });
    setSaveError(null);
    setIsModalOpen(true);
  };

  // Parent header button → open create modal. Ignore whatever value the
  // counter had when this tab mounted, so switching back to the tab doesn't
  // reopen the modal on its own.
  const mountedCreateRequest = useRef(createRequest);
  useEffect(() => {
    if (createRequest !== mountedCreateRequest.current) handleAddItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createRequest]);

  const handleEditItem = (item: ApiExperienceCategoryRecord) => {
    setEditingItem(item);
    setFormData({
      nameEn: item.name.en,
      nameAr: item.name.ar,
      iconName: item.iconName || '✨',
      iconUrl: item.iconUrl ?? '',
      displayOrder: item.displayOrder ?? 0,
    });
    setSaveError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (item: ApiExperienceCategoryRecord) => {
    if (!window.confirm(`Delete experience category "${item.name.en}"? Existing experiences will retain their data.`)) return;
    setDeletingId(item._id);
    setActionError(null);
    try {
      await deleteExperienceCategory(item._id);
      await fetchCategories();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete this experience category.');
    } finally {
      setDeletingId(null);
    }
  };

  // No dedicated toggle route for experience categories — PATCH isActive.
  const handleToggleActive = async (item: ApiExperienceCategoryRecord) => {
    setTogglingId(item._id);
    setActionError(null);
    try {
      const nextActive = !(item.isActive ?? true);
      const updated = await updateExperienceCategory(item._id, { isActive: nextActive });
      setCategories(prev => prev.map(c => (c._id === item._id ? { ...c, ...updated, isActive: updated.isActive ?? nextActive } : c)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to toggle this experience category.');
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
    if (!formData.nameEn.trim()) {
      setSaveError('English name is required.');
      return;
    }
    // The API requires name.ar — like the retreats form, fall back to English.
    const nameAr = formData.nameAr.trim() || formData.nameEn.trim();
    const iconName = formData.iconName.trim() || '✨';
    setIsSaving(true);
    setSaveError(null);
    try {
      const payload = {
        name: { en: formData.nameEn.trim(), ar: nameAr },
        iconName: iconName || undefined,
        iconUrl: formData.iconUrl || undefined,
        displayOrder: Number(formData.displayOrder) || 0,
      };
      if (editingItem) {
        await updateExperienceCategory(editingItem._id, payload);
      } else {
        await createExperienceCategory({ ...payload, isActive: true });
      }
      await fetchCategories();
      setIsModalOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save this experience category.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 text-accent flex items-center justify-center shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black text-primary uppercase">Experience Category Architecture</h4>
            <p className="text-[11px] text-muted-text">
              Categories registered here populate the experience catalog, the guest explore page and mobile app filters.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAddItem}
          className="px-4 py-2 bg-primary text-accent rounded-xl text-[10px] font-black uppercase tracking-wider hover:opacity-90 shrink-0 cursor-pointer"
        >
          + Add Category
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
            onClick={fetchCategories}
            className="mt-4 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] bg-primary text-white hover:opacity-90 transition-all"
          >
            Retry
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-surface border border-border-misrah rounded-[48px] p-16 text-center space-y-4">
          <p className="text-xs font-bold text-muted-text/60 uppercase tracking-widest">No experience categories yet.</p>
          <button
            onClick={handleAddItem}
            className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] bg-primary text-accent hover:opacity-90 transition-all inline-flex items-center gap-2"
          >
            <Plus size={14} /> Register Experience Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {categories.map(cat => {
              const isActive = cat.isActive ?? true;
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={cat._id}
                  className={`bg-white rounded-3xl border border-border-misrah overflow-hidden shadow-xs hover:shadow-luxury transition-all group flex flex-col ${!isActive ? 'opacity-60' : ''}`}
                >
                  {/* Category Card Header Image */}
                  <div className="h-44 relative overflow-hidden bg-surface">
                    {cat.iconUrl ? (
                      <img
                        src={cat.iconUrl}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        alt={cat.name.en}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff size={32} className="text-muted-text/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />

                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-sm flex items-center gap-1 shadow-sm">
                      <span>{cat.iconName || '✨'}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                        {cat.slug || slugify(cat.name.en)}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <div className="text-lg font-black italic uppercase tracking-tight flex items-baseline justify-between gap-2">
                        <span className="truncate">{cat.name.en}</span>
                        <span className="text-xs text-white/80 font-arabic font-normal shrink-0" dir="rtl">{cat.name.ar}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-xs text-muted-text line-clamp-2 leading-relaxed">
                      {cat.description || 'Curated luxury hospitality retreat experience.'}
                    </p>

                    <div className="pt-3 border-t border-border-misrah flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-1 rounded-lg">
                        {templateCounts[cat._id] ?? '—'} Template Activities
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(cat)}
                          disabled={togglingId === cat._id}
                          className="p-2 rounded-lg text-muted-text hover:text-primary hover:bg-surface transition-colors cursor-pointer disabled:opacity-50"
                          title={isActive ? 'Deactivate Category' : 'Activate Category'}
                        >
                          {togglingId === cat._id ? <Loader2 size={14} className="animate-spin" /> : isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button
                          onClick={() => handleEditItem(cat)}
                          className="p-2 rounded-lg text-muted-text hover:text-primary hover:bg-surface transition-colors cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          disabled={deletingId === cat._id}
                          className="p-2 rounded-lg text-muted-text hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete Category"
                        >
                          {deletingId === cat._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* MODAL: REGISTER / EDIT EXPERIENCE CATEGORY */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
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
                      <Sparkles size={16} />
                    </span>
                    <h2 className="text-xl font-black italic text-primary uppercase">
                      {editingItem ? 'Edit Experience Category' : 'New Experience Category'}
                    </h2>
                  </div>
                  <p className="text-xs text-muted-text font-bold">تصنيف تجارب وفعاليات جديدة</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-surface hover:bg-border-misrah flex items-center justify-center text-primary cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSave();
                }}
                className="space-y-4"
              >
                {/* Image Upload / Preview */}
                <div
                  onClick={() => photoInputRef.current?.click()}
                  className="h-36 rounded-2xl border-2 border-dashed border-border-misrah flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group bg-surface hover:bg-surface/80 transition-colors"
                >
                  {isUploading ? (
                    <Loader2 className="animate-spin text-accent" />
                  ) : formData.iconUrl ? (
                    <img src={formData.iconUrl} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="text-accent mx-auto mb-1" size={20} />
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-text">
                        Upload Category Cover Image
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2">
                    <Upload size={16} />
                    <span>Change Cover Image</span>
                  </div>
                  <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </div>

                {/* Cover Image URL alternative */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">
                    Cover Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.iconUrl}
                    onChange={e => setFormData({ ...formData, iconUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-surface border border-border-misrah rounded-xl px-4 py-3 text-xs font-bold text-primary outline-none focus:border-accent"
                  />
                </div>

                {/* Names (EN and AR) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">
                      Category Name (English) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nameEn}
                      onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
                      placeholder="e.g. Equestrian & Polo"
                      className="w-full bg-surface border border-border-misrah rounded-xl px-4 py-3 text-xs font-bold text-primary outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">
                      Category Name (Arabic)
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      value={formData.nameAr}
                      onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
                      placeholder="مثال: الفروسية والرياضات"
                      className="w-full bg-surface border border-border-misrah rounded-xl px-4 py-3 text-xs font-bold text-primary outline-none focus:border-accent font-arabic"
                    />
                  </div>
                </div>

                {/* Emoji Selection — saved as the category's iconName */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">
                    Category Icon / Emoji
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={formData.iconName}
                      onChange={e => setFormData({ ...formData, iconName: e.target.value })}
                      className="w-16 bg-surface border border-border-misrah rounded-xl px-3 py-2.5 text-center text-lg font-bold outline-none focus:border-accent"
                    />
                    <div className="flex gap-1 flex-wrap flex-1">
                      {PRESET_EMOJIS.map(em => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setFormData({ ...formData, iconName: em })}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-base border transition-all cursor-pointer ${
                            formData.iconName === em ? 'border-accent bg-accent/20 scale-110' : 'border-border-misrah bg-surface hover:bg-white'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description — no description field on experience categories yet */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1">
                    Description & Summary
                  </label>
                  <textarea
                    rows={2}
                    disabled
                    placeholder="e.g. Exclusive desert riding trails, beach endurance gallops & beginner polo clinics..."
                    className="w-full bg-surface border border-border-misrah rounded-xl px-4 py-2.5 text-xs font-medium text-primary outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="text-[9px] font-bold text-muted-text/60 mt-1">Not yet supported by the API — not saved.</p>
                </div>

                {/* Optional Starter Activity for new category — not creatable from here yet */}
                {!editingItem && (
                  <div className="p-4 rounded-2xl bg-surface border border-border-misrah space-y-3 opacity-60">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                        Initial Template Activity (Optional)
                      </span>
                      <span className="text-[9px] text-muted-text font-bold">Catalog Preset</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        disabled
                        placeholder="e.g. Sunset Desert Horse Trail"
                        className="p-2.5 bg-white border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent disabled:cursor-not-allowed"
                      />
                      <input
                        type="number"
                        disabled
                        placeholder="Price (AED)"
                        className="p-2.5 bg-white border border-border-misrah rounded-xl text-xs font-bold text-primary outline-none focus:border-accent disabled:cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[9px] font-bold text-muted-text">
                      Not yet supported by the API — add template activities from Experiences after saving.
                    </p>
                  </div>
                )}

                {saveError && (
                  <p className="text-[10px] font-black text-danger uppercase tracking-widest text-center">{saveError}</p>
                )}

                <div className="flex gap-3 pt-3 border-t border-border-misrah">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3.5 rounded-2xl border border-border-misrah text-xs font-black uppercase tracking-wider text-primary hover:bg-surface cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isUploading}
                    className="flex-[2] py-3.5 bg-primary text-accent rounded-2xl text-xs font-black uppercase tracking-wider hover:opacity-95 shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving && <Loader2 size={14} className="animate-spin" />}
                    {editingItem ? 'Update Category' : 'Finalize & Publish Category'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
