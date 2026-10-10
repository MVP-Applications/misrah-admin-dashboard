import React, { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Search, Loader2, TriangleAlert, Wallet, Landmark, ChevronLeft, ChevronRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { errorMessage } from '../../api/errors';
import { usePreferredCurrency } from '../../hooks/usePreferredCurrency';
import { listSettlements, type Settlement, type SettlementStatus } from '../../features/settlements/api';

// Host Hub → Settlements: the host's own payouts (GET /host/settlements),
// read-only — admins release or decline them.

const PAGE_SIZE = 10;

const TABS: { id: SettlementStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'paid_out', label: 'Paid Out' },
  { id: 'declined', label: 'Declined' },
];

const STATUS_STYLE: Record<SettlementStatus, { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', className: 'bg-accent/10 text-accent', icon: Clock },
  paid_out: { label: 'Paid Out', className: 'bg-success/10 text-success', icon: CheckCircle2 },
  declined: { label: 'Declined', className: 'bg-danger/10 text-danger', icon: XCircle },
};

const money = (amount: number | undefined, currency: string) =>
  `${currency} ${(amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const shortDate = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : format(d, 'd MMM yyyy');
};

const bookingsLabel = (s: Settlement) => {
  const n = s.totalBookingsCount ?? (s.bookingsCount ?? 0) + (s.experienceBookingsCount ?? 0);
  return `${n} booking${n === 1 ? '' : 's'}`;
};

export const HostSettlementsView = () => {
  // Saved currency — sent on every call; the list re-fetches when it changes.
  const currency = usePreferredCurrency();
  const [tab, setTab] = useState<SettlementStatus | 'all'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Settlement[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => { setPage(1); }, [tab, search]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await listSettlements(
        { status: tab === 'all' ? undefined : tab, search: search || undefined, page, limit: PAGE_SIZE, currency },
        'host',
      );
      setItems(res.items);
      setTotalPages(Math.max(1, res.totalPages));
    } catch (err) {
      setItems([]);
      setLoadError(errorMessage(err, 'Failed to load your settlements.'));
    } finally {
      setIsLoading(false);
    }
  }, [tab, search, page, currency]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      <header>
        <h1 className="text-4xl font-sans font-black italic text-primary uppercase tracking-tight leading-none">Settlements</h1>
        <p className="text-muted-text text-[10px] font-black uppercase tracking-[3px] mt-2 opacity-60">
          Payouts for your completed stays & experiences
        </p>
      </header>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="bg-white border border-border-misrah rounded-2xl p-1.5 shadow-sm flex overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                ${tab === t.id ? 'bg-primary text-accent shadow-lg shadow-primary/20' : 'text-muted-text/50 hover:text-primary'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search size={14} className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-muted-text/50" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by STL reference..."
            className="w-full bg-surface border border-border-misrah rounded-2xl pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-3 text-xs font-bold text-primary outline-none focus:border-accent"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-[40px] border border-border-misrah p-24 text-center shadow-sm">
          <Loader2 size={36} className="animate-spin mx-auto text-primary/30" />
        </div>
      ) : loadError ? (
        <div className="bg-danger/5 rounded-[40px] border border-danger/20 p-16 text-center shadow-sm space-y-4">
          <TriangleAlert size={36} className="mx-auto text-danger" />
          <p className="text-[10px] font-bold text-danger/70 uppercase tracking-widest">{loadError}</p>
          <button type="button" onClick={load} className="px-6 py-3 rounded-2xl bg-primary text-accent text-[10px] font-black uppercase tracking-[2px]">
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-border-misrah p-24 text-center shadow-sm space-y-3">
          <Wallet size={36} className="mx-auto text-muted-text/30" />
          <p className="text-xs font-bold text-muted-text/60 uppercase tracking-widest">
            {search ? 'No settlements match this search.' : tab === 'all' ? 'No settlements yet.' : `No ${TABS.find(t => t.id === tab)?.label.toLowerCase()} settlements.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(s => {
            const style = STATUS_STYLE[s.status] ?? STATUS_STYLE.pending;
            const StatusIcon = style.icon;
            const when =
              s.status === 'paid_out' ? shortDate(s.releasedAt) :
              s.status === 'declined' ? shortDate(s.declinedAt) :
              null;
            return (
              <div key={s.id} className="bg-white rounded-[28px] border border-border-misrah p-6 shadow-sm flex flex-col md:flex-row md:items-center gap-5">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-[2px] text-accent">{s.reference}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1 ${style.className}`}>
                      <StatusIcon size={11} /> {style.label}{when ? ` · ${when}` : ''}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-primary/70">
                    {s.period?.formattedPeriod || [shortDate(s.period?.startDate), shortDate(s.period?.endDate)].filter(Boolean).join(' – ') || '—'}
                    {' · '}{bookingsLabel(s)}
                  </p>
                  <p className="text-[11px] font-medium text-muted-text inline-flex items-center gap-1.5">
                    <Landmark size={12} /> {s.payoutDestination?.formattedPayoutTo ?? 'No payout account set'}
                  </p>
                  {s.status === 'declined' && s.declineReason && (
                    <p className="text-[11px] font-bold text-danger/80">Reason: {s.declineReason}</p>
                  )}
                </div>
                <div className="md:text-right rtl:md:text-left shrink-0">
                  <p className="text-[9px] font-black uppercase tracking-[2px] text-muted-text">Net Payout</p>
                  <p className={`text-2xl font-black italic ${s.status === 'declined' ? 'text-primary/40 line-through' : 'text-primary'}`}>
                    {money(s.settlementAmount, s.currency)}
                  </p>
                  {(s.serviceFee !== undefined || s.taxes !== undefined) && (
                    <p className="text-[10px] font-bold text-muted-text">
                      After {money((s.serviceFee ?? 0) + (s.taxes ?? 0), s.currency)} fees & taxes
                    </p>
                  )}
                </div>
              </div>
            );
          })}
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
    </div>
  );
};
