import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, FileText, Loader2, MapPin, Pencil, Search, Trash2, TriangleAlert, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { deletePropertyDraft, listPropertyDrafts } from '../../../features/properties/api';
import type { PropertyDraft, PropertyDraftScope } from '../../../features/properties/types';
import { LoadingSpinner } from '../../ui/LoadingSpinner';

const PAGE_SIZE = 12;
// AddListingModal step indexes — step 0 (ownership) only exists in the admin
// flow, so hosts see phases 1–6 and admins phases 1–7.
const STEP_LABELS: Record<number, string> = {
  0: 'Ownership Node',
  1: 'Asset Taxonomy',
  2: 'Geography Index',
  3: 'Time Synchronization',
  4: 'Visual Inventory',
  5: 'Strategic Narrative',
  6: 'Security Protocols',
};

const draftImage = (draft: PropertyDraft): string | null => {
  const first = draft.images?.[0];
  return first && typeof first === 'object' ? first.fullUrl ?? first.url ?? null : null;
};

const draftCity = (draft: PropertyDraft): string | null =>
  (typeof draft.cityId === 'object' ? draft.cityId?.name : draft.city?.name) ?? null;

// Admin drafts: who the property is being listed for, if picked yet.
const draftOwner = (draft: PropertyDraft): string | null =>
  (typeof draft.userId === 'object' ? draft.userId?.name : undefined) ?? draft.owner?.name ?? draft.name ?? draft.email ?? null;

interface PropertyDraftsTabProps {
  scope: PropertyDraftScope;
  onContinue: (draft: PropertyDraft) => void;
  // Bumped by the parent whenever a draft is saved or published elsewhere.
  refreshKey: number;
}

export const PropertyDraftsTab = ({ scope, onContinue, refreshKey }: PropertyDraftsTabProps) => {
  const isAdmin = scope === 'admin';
  const firstStep = isAdmin ? 0 : 1;
  const totalPhases = isAdmin ? 7 : 6;
  const [drafts, setDrafts] = useState<PropertyDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Debounce the search box so each keystroke doesn't hit the API.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchDrafts = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    listPropertyDrafts({ page, limit: PAGE_SIZE, search }, scope)
      .then(res => {
        setDrafts(res.data);
        setTotalPages(Math.max(1, res.meta.totalPages));
      })
      .catch(err => {
        setDrafts([]);
        setLoadError(err instanceof Error ? err.message : 'Failed to load drafts.');
      })
      .finally(() => setLoading(false));
  }, [page, search, scope]);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts, refreshKey]);

  const handleDelete = async (draft: PropertyDraft) => {
    if (!window.confirm(`Delete the draft "${draft.title || 'Untitled draft'}"? This can't be undone.`)) return;
    setDeletingId(draft._id);
    try {
      await deletePropertyDraft(draft._id, scope);
      // Step back a page if this emptied the current one.
      if (drafts.length === 1 && page > 1) setPage(p => p - 1);
      else fetchDrafts();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to delete draft.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative w-full sm:w-80">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search drafts..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-border-misrah text-xs font-bold text-primary outline-none focus:border-accent shadow-2xs"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <LoadingSpinner />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-text/50">Loading drafts…</p>
        </div>
      ) : loadError ? (
        <div className="bg-danger/5 rounded-[32px] border border-danger/20 p-12 text-center space-y-4">
          <TriangleAlert size={32} className="mx-auto text-danger" />
          <p className="text-[10px] font-bold text-danger/70 uppercase tracking-widest">{loadError}</p>
          <button
            onClick={fetchDrafts}
            className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] bg-primary text-white hover:opacity-90 transition-all"
          >
            Retry
          </button>
        </div>
      ) : drafts.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-border-misrah p-16 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mx-auto text-[#D4C3B5]">
            <FileText size={24} />
          </div>
          <p className="text-[10px] font-black text-muted-text/60 uppercase tracking-widest">
            {search ? 'No drafts match your search' : 'No drafts yet — use “Save as Draft” while creating a listing'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {drafts.map(draft => {
              const image = draftImage(draft);
              const city = draftCity(draft);
              const step = Math.min(Math.max(draft.step ?? firstStep, firstStep), 6);
              // Displayed phase, matching the modal's own numbering.
              const phase = isAdmin ? step + 1 : step;
              const owner = isAdmin ? draftOwner(draft) : null;
              const updated = draft.updatedAt ?? draft.createdAt;
              return (
                <motion.div
                  layout
                  key={draft._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[32px] border border-border-misrah overflow-hidden shadow-sm hover:shadow-luxury transition-all flex flex-col"
                >
                  <div className="relative h-36 bg-surface border-b border-border-misrah/40 flex items-center justify-center">
                    {image ? (
                      <img src={image} alt={draft.title ?? 'Draft'} className="w-full h-full object-cover" />
                    ) : (
                      <FileText size={28} className="text-[#D4C3B5]" />
                    )}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 border border-border-misrah/50 text-[9px] font-black uppercase tracking-wider text-accent">
                      Draft
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col gap-3">
                    <div>
                      <h3 className="text-base font-black italic text-primary uppercase tracking-tight truncate">
                        {draft.title || 'Untitled draft'}
                      </h3>
                      {city && (
                        <p className="flex items-center gap-1 text-[10px] font-bold text-muted-text uppercase tracking-widest mt-1">
                          <MapPin size={11} className="text-accent" /> {city}
                        </p>
                      )}
                      {isAdmin && (
                        <p className="flex items-center gap-1 text-[10px] font-bold text-muted-text uppercase tracking-widest mt-1 truncate">
                          <UserIcon size={11} className="text-accent shrink-0" /> {owner ?? 'Owner not selected'}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider">
                        <span className="text-primary/50">Phase {String(phase).padStart(2, '0')} · {STEP_LABELS[step] ?? 'In progress'}</span>
                        <span className="text-muted-text/60">{phase}/{totalPhases}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${(phase / totalPhases) * 100}%` }} />
                      </div>
                    </div>

                    {updated && (
                      <p className="text-[9px] font-bold text-muted-text/60 uppercase tracking-widest">
                        Saved {format(new Date(updated), 'd MMM yyyy, HH:mm')}
                      </p>
                    )}

                    <div className="mt-auto flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => onContinue(draft)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-accent text-[10px] font-black uppercase tracking-[2px] hover:opacity-90 transition-all"
                      >
                        <Pencil size={13} /> Continue
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(draft)}
                        disabled={deletingId === draft._id}
                        aria-label="Delete draft"
                        className="w-11 flex items-center justify-center rounded-2xl border border-danger/30 text-danger hover:bg-danger/10 transition-all disabled:opacity-50"
                      >
                        {deletingId === draft._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {!loading && !loadError && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="w-9 h-9 rounded-xl bg-white border border-border-misrah flex items-center justify-center text-primary/60 disabled:opacity-30 hover:border-accent transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-text">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="w-9 h-9 rounded-xl bg-white border border-border-misrah flex items-center justify-center text-primary/60 disabled:opacity-30 hover:border-accent transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
