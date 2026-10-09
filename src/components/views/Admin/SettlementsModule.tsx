import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import {
  Search,
  Loader2,
  TriangleAlert,
  Check,
  X,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Landmark,
  Info,
} from 'lucide-react';
import { GuestAvatar } from '../../GuestAvatar';
import {
  approveSettlement,
  isUsingSampleSettlements,
  listSettlements,
  rejectSettlement,
  type Settlement,
  type SettlementStatus,
} from '../../../features/settlements/api';

// Admin → Host Settlements: payouts owed to hosts, approved (success) or
// rejected by an admin.

const STATUS_TABS: { id: SettlementStatus; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Paid Out' },
  { id: 'rejected', label: 'Declined' },
];

const money = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const shortDate = (iso?: string | null) => (iso ? format(new Date(iso), 'd MMM yyyy') : '—');

export const SettlementsModule = () => {
  const [status, setStatus] = useState<SettlementStatus>('pending');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Settlement[]>([]);
  const [allItems, setAllItems] = useState<Settlement[]>([]); // for the summary tiles
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Settlement | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const showToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [filtered, everything] = await Promise.all([
        listSettlements({ status, search: search || undefined }),
        listSettlements(),
      ]);
      setItems(filtered);
      setAllItems(everything);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load settlements.');
    } finally {
      setIsLoading(false);
    }
  }, [status, search]);

  useEffect(() => { load(); }, [load]);

  const summary = useMemo(() => {
    const pending = allItems.filter(s => s.status === 'pending');
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const settledThisMonth = allItems.filter(s => s.status === 'approved' && s.processedAt && Date.parse(s.processedAt) >= monthStart);
    const currency = allItems[0]?.currency ?? 'AED';
    return {
      currency,
      pendingTotal: pending.reduce((sum, s) => sum + s.amount, 0),
      pendingCount: pending.length,
      settledTotal: settledThisMonth.reduce((sum, s) => sum + s.amount, 0),
      settledCount: settledThisMonth.length,
      rejectedCount: allItems.filter(s => s.status === 'rejected').length,
    };
  }, [allItems]);

  const handleApprove = async (s: Settlement) => {
    if (busyId) return;
    setBusyId(s.id);
    try {
      await approveSettlement(s.id);
      showToast(`Payout of ${money(s.amount, s.currency)} released to ${s.hostName}`);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to release the payout.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const openReject = (s: Settlement) => {
    setRejectTarget(s);
    setRejectReason('');
    setRejectError(null);
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      setRejectError('Please give a reason — it is shown to the host.');
      return;
    }
    setBusyId(rejectTarget.id);
    try {
      await rejectSettlement(rejectTarget.id, rejectReason.trim());
      showToast(`Payout to ${rejectTarget.hostName} declined`);
      setRejectTarget(null);
      await load();
    } catch (err) {
      setRejectError(err instanceof Error ? err.message : 'Failed to decline the payout.');
    } finally {
      setBusyId(null);
    }
  };

  const tiles = [
    { label: 'Awaiting Settlement', value: money(summary.pendingTotal, summary.currency), sub: `${summary.pendingCount} request${summary.pendingCount === 1 ? '' : 's'}`, icon: Clock, tone: 'text-accent bg-accent/10' },
    { label: 'Paid Out This Month', value: money(summary.settledTotal, summary.currency), sub: `${summary.settledCount} payout${summary.settledCount === 1 ? '' : 's'}`, icon: CheckCircle2, tone: 'text-success bg-success/10' },
    { label: 'Declined', value: String(summary.rejectedCount), sub: 'All time', icon: XCircle, tone: 'text-danger bg-danger/10' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-black uppercase tracking-wider">
              Treasury
            </span>
            <span className="text-xs font-bold text-muted-text">تسويات المضيفين</span>
          </div>
          <h1 className="text-4xl font-sans font-black italic text-primary uppercase tracking-tight leading-none">Host Settlements</h1>
          <p className="text-muted-text text-[10px] font-black uppercase tracking-[3px] mt-2 opacity-60">
            Review and release host payouts
          </p>
        </div>
      </header>

      {isUsingSampleSettlements && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
            Showing sample settlements — the backend has no settlement API yet. Approve / reject work on this sample data only and reset on reload.
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiles.map(t => (
          <div key={t.label} className="bg-white rounded-[32px] border border-border-misrah p-6 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${t.tone}`}>
              <t.icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[2px] text-muted-text">{t.label}</p>
              <p className="text-xl font-black italic text-primary truncate">{t.value}</p>
              <p className="text-[10px] font-bold text-muted-text/70">{t.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="bg-white border border-border-misrah rounded-2xl p-1.5 shadow-sm flex">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatus(tab.id)}
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2
                ${status === tab.id ? 'bg-primary text-accent shadow-lg shadow-primary/20' : 'text-muted-text/50 hover:text-primary'}`}
            >
              {tab.label}
              {tab.id === 'pending' && summary.pendingCount > 0 && (
                <span className={`min-w-5 h-5 px-1 rounded-full text-[9px] flex items-center justify-center ${status === tab.id ? 'bg-accent text-primary' : 'bg-danger text-white'}`}>
                  {summary.pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search size={14} className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-muted-text/50" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search host or reference..."
            className="w-full bg-surface border border-border-misrah rounded-2xl pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-3 text-xs font-bold text-primary outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="bg-white rounded-[48px] border border-border-misrah p-24 text-center shadow-sm">
          <Loader2 size={36} className="animate-spin mx-auto text-primary/30" />
        </div>
      ) : loadError ? (
        <div className="bg-danger/5 rounded-[48px] border border-danger/20 p-16 text-center shadow-sm space-y-4">
          <TriangleAlert size={36} className="mx-auto text-danger" />
          <p className="text-[10px] font-bold text-danger/70 uppercase tracking-widest">{loadError}</p>
          <button type="button" onClick={load} className="px-6 py-3 rounded-2xl bg-primary text-accent text-[10px] font-black uppercase tracking-[2px]">
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-[48px] border border-border-misrah p-24 text-center shadow-sm space-y-3">
          <Wallet size={36} className="mx-auto text-muted-text/30" />
          <p className="text-xs font-bold text-muted-text/60 uppercase tracking-widest">
            {search ? 'No settlements match this search.' : status === 'pending' ? 'No settlements awaiting review.' : `No ${STATUS_TABS.find(t => t.id === status)?.label.toLowerCase()} settlements.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-border-misrah shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface/60 border-b border-border-misrah">
                <tr className="text-[9px] font-black uppercase tracking-[2px] text-muted-text">
                  <th className="px-6 py-4">Host</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Payout To</th>
                  <th className="px-6 py-4 text-right rtl:text-left">{status === 'pending' ? 'Action' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-misrah/50">
                {items.map(s => (
                  <tr key={s.id} className="hover:bg-surface/40 transition-colors align-middle">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 min-w-[180px]">
                        <GuestAvatar url={s.hostAvatar} name={s.hostName} className="w-10 h-10 rounded-xl" iconSize={18} />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-primary truncate">{s.hostName}</p>
                          <p className="text-[10px] font-medium text-muted-text truncate">{s.hostEmail ?? s.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-base font-black italic text-primary">{money(s.amount, s.currency)}</p>
                      <p className="text-[10px] font-bold text-muted-text">{s.bookingsCount} booking{s.bookingsCount === 1 ? '' : 's'} · {s.id.toUpperCase()}</p>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-bold text-primary/70 whitespace-nowrap">
                      {shortDate(s.periodStart)} – {shortDate(s.periodEnd)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary/70 whitespace-nowrap">
                        <Landmark size={13} className="text-muted-text" />
                        {s.payoutDestination ?? 'Not set'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {s.status === 'pending' ? (
                        <div className="flex items-center justify-end rtl:justify-start gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(s)}
                            disabled={busyId !== null}
                            className="px-4 py-2.5 rounded-xl bg-success text-white text-[9px] font-black uppercase tracking-[2px] flex items-center gap-1.5 hover:opacity-90 transition-all disabled:opacity-50"
                          >
                            {busyId === s.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                            Release Payout
                          </button>
                          <button
                            type="button"
                            onClick={() => openReject(s)}
                            disabled={busyId !== null}
                            className="px-4 py-2.5 rounded-xl bg-white border border-danger text-danger text-[9px] font-black uppercase tracking-[2px] flex items-center gap-1.5 hover:bg-danger/5 transition-all disabled:opacity-50"
                          >
                            <X size={13} /> Decline
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end rtl:items-start gap-1">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${s.status === 'approved' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                            {s.status === 'approved' ? 'Paid Out' : 'Declined'}
                          </span>
                          {s.rejectionReason && (
                            <p className="text-[10px] text-danger/80 max-w-[220px] text-right rtl:text-left leading-snug">{s.rejectionReason}</p>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject modal */}
      <AnimatePresence>
        {rejectTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => busyId === null && setRejectTarget(null)}
              className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[36px] w-full max-w-md p-8 relative z-10 shadow-2xl space-y-5"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-danger">Decline Payout</span>
                <h3 className="text-xl font-black italic text-primary uppercase mt-0.5">{rejectTarget.hostName}</h3>
                <p className="text-sm font-black text-primary/70 mt-1">{money(rejectTarget.amount, rejectTarget.currency)}</p>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[2px] text-muted-text">Reason for Declining *</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="e.g. Payout destination could not be verified."
                  className="w-full bg-surface border border-border-misrah rounded-2xl px-4 py-3 text-xs font-medium text-primary outline-none focus:border-accent resize-none"
                />
                {rejectError && <p className="text-[10px] font-bold text-danger">{rejectError}</p>}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRejectTarget(null)}
                  disabled={busyId !== null}
                  className="flex-1 py-3.5 rounded-2xl border border-border-misrah text-[10px] font-black uppercase tracking-wider text-primary hover:bg-surface disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmReject}
                  disabled={busyId !== null}
                  className="flex-[2] py-3.5 rounded-2xl bg-danger text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {busyId === rejectTarget.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                  Decline Payout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-8 right-8 z-[60] px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2
              ${toast.tone === 'success' ? 'bg-primary text-accent' : 'bg-danger text-white'}`}
          >
            {toast.tone === 'success' ? <CheckCircle2 size={16} /> : <TriangleAlert size={16} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
