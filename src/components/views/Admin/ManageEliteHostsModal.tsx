import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Plus, Minus, Loader2, TriangleAlert } from 'lucide-react';
import { addHostsToListing, removeHostsFromListing } from '../../../features/homePageListings/api';
import type { AdminHomePageListing } from '../../../features/homePageListings/types';
import type { AdminUserRecord } from '../../../features/adminUsers/types';

interface ManageEliteHostsModalProps {
  section: AdminHomePageListing;
  // Reuses the same fetch EliteNodesModule already did — avoids a duplicate
  // GET /admin/users call just to open this modal. Same FETCH_LIMIT
  // simplification as ManageCategoryPropertiesModal: won't surface every
  // host-eligible user on a very large user base.
  allUsers: AdminUserRecord[];
  onClose: () => void;
  onUpdated: (updated: AdminHomePageListing) => void;
}

export const ManageEliteHostsModal = ({ section, allUsers, onClose, onUpdated }: ManageEliteHostsModalProps) => {
  const [currentSection, setCurrentSection] = useState(section);
  const [search, setSearch] = useState('');
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [mutateError, setMutateError] = useState<string | null>(null);

  const assignedUsers = allUsers.filter((u) => currentSection.hostIds.includes(u._id));
  const searchTerm = search.trim().toLowerCase();
  // Only host-eligible users (canHost or already in HOST mode) are offered —
  // matches this section's own catalogueType semantics.
  const candidateUsers = allUsers.filter(
    (u) =>
      !currentSection.hostIds.includes(u._id) &&
      (u.canHost || u.mode === 'HOST') &&
      (searchTerm === '' || u.name?.toLowerCase().includes(searchTerm) || u.email?.toLowerCase().includes(searchTerm)),
  );

  const handleAdd = async (userId: string) => {
    setMutatingId(userId);
    setMutateError(null);
    try {
      const updated = await addHostsToListing(currentSection._id, { hostIds: [userId] });
      setCurrentSection(updated);
      onUpdated(updated);
    } catch (err) {
      setMutateError(err instanceof Error ? err.message : 'Failed to add this host.');
    } finally {
      setMutatingId(null);
    }
  };

  const handleRemove = async (userId: string) => {
    setMutatingId(userId);
    setMutateError(null);
    try {
      const updated = await removeHostsFromListing(currentSection._id, { hostIds: [userId] });
      setCurrentSection(updated);
      onUpdated(updated);
    } catch (err) {
      setMutateError(err instanceof Error ? err.message : 'Failed to remove this host.');
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
          <h2 className="text-2xl font-black italic text-primary uppercase mb-1">{currentSection.title.en}</h2>
          <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-widest mb-8">Manage Elite Host Membership</p>

          {mutateError && (
            <div className="bg-danger/5 border border-danger/20 rounded-2xl p-4 flex items-center gap-3 text-danger mb-4">
              <TriangleAlert size={16} />
              <p className="text-[10px] font-black uppercase tracking-widest">{mutateError}</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-8 pr-1">
            <div className="space-y-3">
              <h3 className="text-[11px] font-black italic text-primary/40 uppercase tracking-[2.5px]">
                Current Members ({assignedUsers.length})
              </h3>
              {assignedUsers.length === 0 ? (
                <p className="text-[10px] font-bold text-muted-text/50 uppercase tracking-widest px-1">No elite hosts yet</p>
              ) : (
                <div className="space-y-2">
                  {assignedUsers.map((u) => (
                    <div key={u._id} className="flex items-center justify-between bg-surface rounded-2xl px-5 py-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-primary truncate">{u.name || 'Unnamed'}</p>
                        <p className="text-[9px] font-bold text-muted-text/50 truncate">{u.email}</p>
                      </div>
                      <button
                        onClick={() => handleRemove(u._id)}
                        disabled={mutatingId === u._id}
                        className="w-8 h-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center hover:bg-danger hover:text-white transition-all disabled:opacity-50 shrink-0"
                      >
                        {mutatingId === u._id ? <Loader2 size={14} className="animate-spin" /> : <Minus size={14} />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-[11px] font-black italic text-primary/40 uppercase tracking-[2.5px]">Add Hosts</h3>
              <div className="relative">
                <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-text/50" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full bg-surface border border-border-misrah rounded-2xl pl-12 pr-5 py-3 text-xs font-bold"
                />
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {candidateUsers.length === 0 ? (
                  <p className="text-[10px] font-bold text-muted-text/50 uppercase tracking-widest px-1">No matching hosts</p>
                ) : (
                  candidateUsers.map((u) => (
                    <div key={u._id} className="flex items-center justify-between bg-surface rounded-2xl px-5 py-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-primary truncate">{u.name || 'Unnamed'}</p>
                        <p className="text-[9px] font-bold text-muted-text/50 truncate">{u.email}</p>
                      </div>
                      <button
                        onClick={() => handleAdd(u._id)}
                        disabled={mutatingId === u._id}
                        className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center hover:bg-success hover:text-white transition-all disabled:opacity-50 shrink-0"
                      >
                        {mutatingId === u._id ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
