import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Plus, Minus, Loader2, TriangleAlert } from 'lucide-react';
import { listAdminProperties } from '../../../features/properties/api';
import { addPropertiesToCategory, removePropertiesFromCategory } from '../../../features/categories/api';
import type { ApiPropertyListItem } from '../../../features/properties/types';
import type { ApiCategory } from '../../../features/categories/types';

interface ManageCategoryPropertiesModalProps {
  category: ApiCategory;
  onClose: () => void;
  onUpdated: (updated: ApiCategory) => void;
}

// Fetches a generous single page of properties once, then filters client-side
// for both "already assigned" and "search to add" — same simplification
// HostingModule uses (FETCH_LIMIT), since there's no server-side "search
// properties not in category X" endpoint. Documented as a known gap in
// API_INTEGRATION.md — this won't surface every property on a very large
// catalog.
const FETCH_LIMIT = 200;

export const ManageCategoryPropertiesModal = ({ category, onClose, onUpdated }: ManageCategoryPropertiesModalProps) => {
  const [currentCategory, setCurrentCategory] = useState(category);
  const [allProperties, setAllProperties] = useState<ApiPropertyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [mutateError, setMutateError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    listAdminProperties({ limit: FETCH_LIMIT })
      .then((res) => {
        if (!cancelled) setAllProperties(res.data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load properties.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const assignedProperties = allProperties.filter((p) => currentCategory.propertyIds.includes(p._id));
  const searchTerm = search.trim().toLowerCase();
  const candidateProperties = allProperties.filter(
    (p) => !currentCategory.propertyIds.includes(p._id) && (searchTerm === '' || p.title.toLowerCase().includes(searchTerm)),
  );

  const handleAdd = async (propertyId: string) => {
    setMutatingId(propertyId);
    setMutateError(null);
    try {
      const updated = await addPropertiesToCategory(currentCategory._id, { propertyIds: [propertyId] });
      setCurrentCategory(updated);
      onUpdated(updated);
    } catch (err) {
      setMutateError(err instanceof Error ? err.message : 'Failed to add this property.');
    } finally {
      setMutatingId(null);
    }
  };

  const handleRemove = async (propertyId: string) => {
    setMutatingId(propertyId);
    setMutateError(null);
    try {
      const updated = await removePropertiesFromCategory(currentCategory._id, { propertyIds: [propertyId] });
      setCurrentCategory(updated);
      onUpdated(updated);
    } catch (err) {
      setMutateError(err instanceof Error ? err.message : 'Failed to remove this property.');
    } finally {
      setMutatingId(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-primary/60 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[48px] w-full max-w-2xl relative z-10 p-10 max-h-[85vh] flex flex-col">
          <button onClick={onClose} className="absolute top-8 right-8 text-muted-text"><X size={24} /></button>
          <h2 className="text-2xl font-black italic text-primary uppercase mb-1">{currentCategory.name.en}</h2>
          <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-widest mb-8">Manage Properties In This Category</p>

          {mutateError && (
            <div className="bg-danger/5 border border-danger/20 rounded-2xl p-4 flex items-center gap-3 text-danger mb-4">
              <TriangleAlert size={16} />
              <p className="text-[10px] font-black uppercase tracking-widest">{mutateError}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-primary/30" />
            </div>
          ) : loadError ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-center">
              <TriangleAlert size={32} className="text-danger" />
              <p className="text-[10px] font-bold text-danger/70 uppercase tracking-widest">{loadError}</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-8 pr-1">
              <div className="space-y-3">
                <h3 className="text-[11px] font-black italic text-primary/40 uppercase tracking-[2.5px]">
                  Assigned ({assignedProperties.length})
                </h3>
                {assignedProperties.length === 0 ? (
                  <p className="text-[10px] font-bold text-muted-text/50 uppercase tracking-widest px-1">No properties assigned yet</p>
                ) : (
                  <div className="space-y-2">
                    {assignedProperties.map((p) => (
                      <div key={p._id} className="flex items-center justify-between bg-surface rounded-2xl px-5 py-3">
                        <span className="text-xs font-bold text-primary truncate">{p.title}</span>
                        <button
                          onClick={() => handleRemove(p._id)}
                          disabled={mutatingId === p._id}
                          className="w-8 h-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center hover:bg-danger hover:text-white transition-all disabled:opacity-50 shrink-0"
                        >
                          {mutatingId === p._id ? <Loader2 size={14} className="animate-spin" /> : <Minus size={14} />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-[11px] font-black italic text-primary/40 uppercase tracking-[2.5px]">Add Properties</h3>
                <div className="relative">
                  <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-text/50" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by property title..."
                    className="w-full bg-surface border border-border-misrah rounded-2xl pl-12 pr-5 py-3 text-xs font-bold"
                  />
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {candidateProperties.length === 0 ? (
                    <p className="text-[10px] font-bold text-muted-text/50 uppercase tracking-widest px-1">No matching properties</p>
                  ) : (
                    candidateProperties.map((p) => (
                      <div key={p._id} className="flex items-center justify-between bg-surface rounded-2xl px-5 py-3">
                        <span className="text-xs font-bold text-primary truncate">{p.title}</span>
                        <button
                          onClick={() => handleAdd(p._id)}
                          disabled={mutatingId === p._id}
                          className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center hover:bg-success hover:text-white transition-all disabled:opacity-50 shrink-0"
                        >
                          {mutatingId === p._id ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
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
    </AnimatePresence>
  );
};
