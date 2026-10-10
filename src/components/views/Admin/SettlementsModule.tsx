import React, { useCallback, useEffect, useState } from 'react';
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
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { GuestAvatar } from '../../GuestAvatar';
import { errorMessage } from '../../../api/errors';
import { usePreferredCurrency } from '../../../hooks/usePreferredCurrency';
import {
  declineSettlement,
  generateSettlementBatch,
  getSettlementStats,
  listSettlements,
  releaseSettlement,
  type Settlement,
  type SettlementStats,
  type SettlementStatus,
} from '../../../features/settlements/api';

// Admin → Host Settlements: payouts owed to hosts, released or declined.

const PAGE_SIZE = 10;

const STATUS_TABS: { id: SettlementStatus; label: string; countKey: keyof SettlementStats['tabCounts'] }[] = [
  { id: 'pending', label: 'Pending', countKey: 'pending' },
  { id: 'paid_out', label: 'Paid Out', countKey: 'paidOut' },
  { id: 'declined', label: 'Declined', countKey: 'declined' },
];

const money = (amount: number | undefined, currency: string) =>
  `${currency} ${(amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const shortDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : format(d, 'd MMM yyyy');
};

const bookingsLabel = (n?: number) => `${n ?? 0} booking${n === 1 ? '' : 's'}`;

export const SettlementsModule = () => {
  // Saved currency — sent on every call; lists re-fetch when it changes.
  const currency = usePreferredCurrency();
  const [status, setStatus] = useState<SettlementStatus>('pending');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Settlement[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<SettlementStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Release / decline / generate modals
  const [releaseTarget, setReleaseTarget] = useState<Settlement | null>(null);
  const [releaseRef, setReleaseRef] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [declineTarget, setDeclineTarget] = useState<Settlement | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generateRange, setGenerateRange] = useState({ startDate: '', endDate: '' });
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const showToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => { setPage(1); }, [status, search]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await getSettlementStats(currency));
    } catch {
      // tiles just stay empty — the list has its own error state
    }
  }, [currency]);

  const loadList = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await listSettlements({ status, search: search || undefined, page, limit: PAGE_SIZE, currency });
      setItems(res.items);
      setTotalPages(Math.max(1, res.totalPages));
    } catch (err) {
      setItems([]);
      setLoadError(errorMessage(err, 'Failed to load settlements.'));
    } finally {
      setIsLoading(false);
    }
  }, [status, search, page, currency]);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { loadStats(); }, [loadStats]);

  const refreshAll = () => Promise.all([loadList(), loadStats()]);

  // ---- Release
  const openRelease = (s: Settlement) => {
    setReleaseTarget(s);
    setReleaseRef('');
    setReleaseNotes('');
    setModalError(null);
  };

  const confirmRelease = async () => {
    if (!releaseTarget) return;
    setBusyId(releaseTarget.id);
    setModalError(null);
    try {
      await releaseSettlement(releaseTarget.id, { transactionReference: releaseRef, notes: releaseNotes });
      showToast(`Payout of ${money(releaseTarget.settlementAmount, releaseTarget.currency)} released to ${releaseTarget.host.name}`);
      setReleaseTarget(null);
      await refreshAll();
    } catch (err) {
      setModalError(errorMessage(err, 'Failed to release the payout.'));
    } finally {
      setBusyId(null);
    }
  };

  // ---- Decline
  const openDecline = (s: Settlement) => {
    setDeclineTarget(s);
    setDeclineReason('');
    setModalError(null);
  };

  const confirmDecline = async () => {
    if (!declineTarget) return;
    if (!declineReason.trim()) {
      setModalError('Please give a reason — it is shown to the host.');
      return;
    }
    setBusyId(declineTarget.id);
    setModalError(null);
    try {
      await declineSettlement(declineTarget.id, declineReason.trim());
      showToast(`Payout to ${declineTarget.host.name} declined`);
      setDeclineTarget(null);
      await refreshAll();
    } catch (err) {
      setModalError(errorMessage(err, 'Failed to decline the payout.'));
    } finally {
      setBusyId(null);
    }
  };

  // ---- Generate batch
  const confirmGenerate = async () => {
    const { startDate, endDate } = generateRange;
    if (startDate && endDate && endDate < startDate) {
      setModalError('The end date must be on or after the start date.');
      return;
    }
    setBusyId('generate');
    setModalError(null);
    try {
      await generateSettlementBatch({
        ...(startDate ? { startDate: `${startDate}T00:00:00.000Z` } : {}),
        ...(endDate ? { endDate: `${endDate}T23:59:59.999Z` } : {}),
      });
      showToast('Settlement batch generated');
      setIsGenerateOpen(false);
      setStatus('pending');
      await refreshAll();
    } catch (err) {
      setModalError(errorMessage(err, 'Failed to generate settlements.'));
    } finally {
      setBusyId(null);
    }
  };

  const awaiting = stats?.awaitingSettlement;
  const paidOut = stats?.paidOutThisMonth;
  const tiles = [
    {
      label: 'Awaiting Settlement',
      value: awaiting ? money(awaiting.amount, awaiting.currency || currency) : '—',
      sub: awaiting ? `${awaiting.count} request${awaiting.count === 1 ? '' : 's'} · ${bookingsLabel(awaiting.totalBookingsCount)}` : '',
      icon: Clock,
      tone: 'text-accent bg-accent/10',
    },
    {
      label: 'Paid Out This Month',
      value: paidOut ? money(paidOut.amount, paidOut.currency || currency) : '—',
      sub: paidOut ? `${paidOut.count} payout${paidOut.count === 1 ? '' : 's'} · ${bookingsLabel(paidOut.totalBookingsCount)}` : '',
      icon: CheckCircle2,
      tone: 'text-success bg-success/10',
    },
    {
      label: 'Declined',
      value: stats ? String(stats.declined.count) : '—',
      sub: stats ? bookingsLabel(stats.declined.totalBookingsCount) : '',
      icon: XCircle,
      tone: 'text-danger bg-danger/10',
    },
  ];

  const modalShell = (open: boolean, onClose: () => void, content: React.ReactNode, wide = false) => (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => busyId === null && onClose()}
            className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-white rounded-[36px] w-full ${wide ? 'max-w-2xl' : 'max-w-md'} p-8 relative z-10 shadow-2xl space-y-5 max-h-[88vh] overflow-y-auto`}
          >
            {content}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

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
        <button
          type="button"
          onClick={() => { setGenerateRange({ startDate: '', endDate: '' }); setModalError(null); setIsGenerateOpen(true); }}
          className="bg-primary text-accent px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw size={14} /> Generate Settlements
        </button>
      </header>

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
              <p className="text-[10px] font-bold text-muted-text/70 truncate">{t.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="bg-white border border-border-misrah rounded-2xl p-1.5 shadow-sm flex">
          {STATUS_TABS.map(tab => {
            const count = stats?.tabCounts[tab.countKey];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatus(tab.id)}
                className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2
                  ${status === tab.id ? 'bg-primary text-accent shadow-lg shadow-primary/20' : 'text-muted-text/50 hover:text-primary'}`}
              >
                {tab.label}
                {count !== undefined && count > 0 && (
                  <span className={`min-w-5 h-5 px-1 rounded-full text-[9px] flex items-center justify-center
                    ${status === tab.id ? 'bg-accent text-primary' : tab.id === 'pending' ? 'bg-danger text-white' : 'bg-surface text-muted-text'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search size={14} className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-muted-text/50" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search host, email or STL reference..."
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
          <button type="button" onClick={loadList} className="px-6 py-3 rounded-2xl bg-primary text-accent text-[10px] font-black uppercase tracking-[2px]">
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
                        <GuestAvatar url={s.host.avatarUrl} name={s.host.name} className="w-10 h-10 rounded-xl" iconSize={18} />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-primary truncate">{s.host.name}</p>
                          <p className="text-[10px] font-medium text-muted-text truncate">{s.host.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-base font-black italic text-primary">{money(s.settlementAmount, s.currency)}</p>
                      <p className="text-[10px] font-bold text-muted-text">
                        {bookingsLabel(s.totalBookingsCount ?? (s.bookingsCount ?? 0) + (s.experienceBookingsCount ?? 0))} · {s.reference}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-bold text-primary/70 whitespace-nowrap">
                      {s.period?.formattedPeriod || `${shortDate(s.period?.startDate)} – ${shortDate(s.period?.endDate)}`}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary/70 whitespace-nowrap">
                        <Landmark size={13} className="text-muted-text" />
                        {s.payoutDestination?.formattedPayoutTo ?? 'Not set'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end rtl:justify-start gap-2">
                        {s.status === 'pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openRelease(s)}
                              disabled={busyId !== null}
                              className="px-4 py-2.5 rounded-xl bg-success text-white text-[9px] font-black uppercase tracking-[2px] flex items-center gap-1.5 hover:opacity-90 transition-all disabled:opacity-50"
                            >
                              <Check size={13} /> Release Payout
                            </button>
                            <button
                              type="button"
                              onClick={() => openDecline(s)}
                              disabled={busyId !== null}
                              className="px-4 py-2.5 rounded-xl bg-white border border-danger text-danger text-[9px] font-black uppercase tracking-[2px] flex items-center gap-1.5 hover:bg-danger/5 transition-all disabled:opacity-50"
                            >
                              <X size={13} /> Decline
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-end rtl:items-start gap-1">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${s.status === 'paid_out' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                              {s.status === 'paid_out' ? 'Paid Out' : 'Declined'}
                            </span>
                            {s.status === 'declined' && s.declineReason && (
                              <p className="text-[10px] text-danger/80 max-w-[220px] text-right rtl:text-left leading-snug">{s.declineReason}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && !loadError && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="w-10 h-10 rounded-xl bg-white border border-border-misrah flex items-center justify-center text-primary disabled:opacity-40">
            <ChevronLeft size={16} />
          </button>
          <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">Page {page} of {totalPages}</span>
          <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="w-10 h-10 rounded-xl bg-white border border-border-misrah flex items-center justify-center text-primary disabled:opacity-40">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Release modal */}
      {modalShell(!!releaseTarget, () => setReleaseTarget(null), releaseTarget && (
        <>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-success">Release Payout</span>
            <h3 className="text-xl font-black italic text-primary uppercase mt-0.5">{releaseTarget.host.name}</h3>
            <p className="text-sm font-black text-primary/70 mt-1">{money(releaseTarget.settlementAmount, releaseTarget.currency)} · {releaseTarget.reference}</p>
            {releaseTarget.payoutDestination?.formattedPayoutTo && (
              <p className="text-[11px] font-bold text-muted-text mt-1 flex items-center gap-1.5"><Landmark size={12} /> {releaseTarget.payoutDestination.formattedPayoutTo}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-[2px] text-muted-text">Bank Transaction Reference</label>
            <input
              value={releaseRef}
              onChange={e => setReleaseRef(e.target.value)}
              placeholder="e.g. TXN-892147"
              className="w-full bg-surface border border-border-misrah rounded-2xl px-4 py-3 text-xs font-bold text-primary outline-none focus:border-accent"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-[2px] text-muted-text">Notes</label>
            <textarea
              value={releaseNotes}
              onChange={e => setReleaseNotes(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="e.g. Processed via Corporate Online Banking batch #4412"
              className="w-full bg-surface border border-border-misrah rounded-2xl px-4 py-3 text-xs font-medium text-primary outline-none focus:border-accent resize-none"
            />
          </div>
          {modalError && <p className="text-[10px] font-bold text-danger">{modalError}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setReleaseTarget(null)} disabled={busyId !== null} className="flex-1 py-3.5 rounded-2xl border border-border-misrah text-[10px] font-black uppercase tracking-wider text-primary hover:bg-surface disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={confirmRelease} disabled={busyId !== null} className="flex-[2] py-3.5 rounded-2xl bg-success text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60">
              {busyId === releaseTarget.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Release Payout
            </button>
          </div>
        </>
      ))}

      {/* Decline modal */}
      {modalShell(!!declineTarget, () => setDeclineTarget(null), declineTarget && (
        <>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-danger">Decline Payout</span>
            <h3 className="text-xl font-black italic text-primary uppercase mt-0.5">{declineTarget.host.name}</h3>
            <p className="text-sm font-black text-primary/70 mt-1">{money(declineTarget.settlementAmount, declineTarget.currency)} · {declineTarget.reference}</p>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-[2px] text-muted-text">Reason for Declining *</label>
            <textarea
              value={declineReason}
              onChange={e => setDeclineReason(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="e.g. Payout destination IBAN could not be verified."
              className="w-full bg-surface border border-border-misrah rounded-2xl px-4 py-3 text-xs font-medium text-primary outline-none focus:border-accent resize-none"
            />
            {modalError && <p className="text-[10px] font-bold text-danger">{modalError}</p>}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setDeclineTarget(null)} disabled={busyId !== null} className="flex-1 py-3.5 rounded-2xl border border-border-misrah text-[10px] font-black uppercase tracking-wider text-primary hover:bg-surface disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={confirmDecline} disabled={busyId !== null} className="flex-[2] py-3.5 rounded-2xl bg-danger text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60">
              {busyId === declineTarget.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
              Decline Payout
            </button>
          </div>
        </>
      ))}

      {/* Generate batch modal */}
      {modalShell(isGenerateOpen, () => setIsGenerateOpen(false), (
        <>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-accent">Generate Settlements</span>
            <h3 className="text-xl font-black italic text-primary uppercase mt-0.5">New Settlement Batch</h3>
            <p className="text-[11px] font-medium text-muted-text mt-1 leading-relaxed">
              Creates pending settlements from completed bookings that haven't been settled yet. Leave the dates empty to include everything up to now.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['startDate', 'endDate'] as const).map(key => (
              <label key={key} className="space-y-1.5 block">
                <span className="text-[9px] font-black uppercase tracking-[2px] text-muted-text">{key === 'startDate' ? 'Period Start' : 'Period End'}</span>
                <input
                  type="date"
                  value={generateRange[key]}
                  min={key === 'endDate' ? generateRange.startDate || undefined : undefined}
                  onChange={e => setGenerateRange(r => ({ ...r, [key]: e.target.value }))}
                  className="w-full bg-surface border border-border-misrah rounded-2xl px-4 py-3 text-xs font-bold text-primary outline-none focus:border-accent"
                />
              </label>
            ))}
          </div>
          {modalError && <p className="text-[10px] font-bold text-danger">{modalError}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsGenerateOpen(false)} disabled={busyId !== null} className="flex-1 py-3.5 rounded-2xl border border-border-misrah text-[10px] font-black uppercase tracking-wider text-primary hover:bg-surface disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={confirmGenerate} disabled={busyId !== null} className="flex-[2] py-3.5 rounded-2xl bg-primary text-accent text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60">
              {busyId === 'generate' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Generate
            </button>
          </div>
        </>
      ))}


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
