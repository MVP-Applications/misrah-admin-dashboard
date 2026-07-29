import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, TriangleAlert, Search } from 'lucide-react';
import { Property } from '../../../types';
import type { HostAssignmentSelection } from '../../../features/properties/types';
import type { ApiError } from '../../../api/types';
import { HostAssignmentPicker } from './HostAssignmentPicker';

interface ReassignHostModalProps {
  property: Property;
  onClose: () => void;
  onAssign: (id: string, selection: Exclude<HostAssignmentSelection, { mode: 'admin' }>) => Promise<void>;
}

export const ReassignHostModal = ({ property, onClose, onAssign }: ReassignHostModalProps) => {
  const [selection, setSelection] = useState<HostAssignmentSelection | undefined>(undefined);
  const [conflictSearch, setConflictSearch] = useState<string | undefined>(undefined);
  const [pickerKey, setPickerKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selection || selection.mode === 'admin') return; // HostAssignmentPicker hides this tab here
    setSubmitting(true);
    setError(null);
    try {
      await onAssign(property.id, selection);
      onClose();
    } catch (err) {
      const message = (err as ApiError)?.message;
      setError(typeof message === 'string' ? message : 'Failed to assign host.');
      // The backend rejects a "New Owner" submission whose email/phone
      // already belongs to a user instead of merging into them (unlike
      // property creation) — point the admin at the Existing Owner search
      // instead of leaving them stuck re-submitting the same conflict.
      if (selection.mode === 'new') {
        setConflictSearch(selection.email || selection.phoneNumber);
        setSelection(undefined);
        setPickerKey((k) => k + 1);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-primary/60 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[48px] w-full max-w-2xl relative z-10 p-10 max-h-[85vh] overflow-y-auto">
          <button onClick={onClose} className="absolute top-8 right-8 text-muted-text"><X size={24} /></button>
          <h2 className="text-2xl font-black italic text-primary uppercase mb-1">Reassign Node</h2>
          <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-widest mb-8">Attach an owner to {property.name}</p>

          {error && (
            <div className="bg-danger/5 border border-danger/20 rounded-2xl p-4 flex items-start gap-3 text-danger mb-6">
              <TriangleAlert size={16} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                {selection === undefined && conflictSearch && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-danger/70 flex items-center gap-1.5">
                    <Search size={11} /> Switched to Existing Owner search below.
                  </p>
                )}
              </div>
            </div>
          )}

          <HostAssignmentPicker
            key={pickerKey}
            value={selection}
            onChange={setSelection}
            allowUnassigned={false}
            initialSearch={conflictSearch}
          />

          <button
            type="button"
            disabled={submitting || !selection}
            onClick={handleSubmit}
            className="w-full mt-8 py-5 rounded-[28px] bg-primary text-accent text-[10px] font-black uppercase tracking-[2px] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
            {submitting ? 'Assigning…' : 'Confirm Reassignment'}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
