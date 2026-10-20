import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Filter, 
  Wallet, 
  Banknote, 
  CreditCard,
  X,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  History,
  RotateCcw,
  Search,
  FileText,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Building2,
  ArrowRight,
  Loader2,
  TriangleAlert,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { StatCard } from '../ui/StatCard';
import { User } from '../../types';
import { downloadHostAuditReport, getAdminEarnings, getHostEarnings } from '../../features/dashboard/api';
import { usePreferredCurrency } from '../../hooks/usePreferredCurrency';
import { errorMessage } from '../../api/errors';
import type { AdminEarningsData, EarningsTimeframe, HostEarningsData } from '../../features/dashboard/types';
import { LoadingSpinner } from '../ui/LoadingSpinner';

const LEDGER_PAGE_SIZE = 7;

interface EarningsViewProps {
  user: User;
}

export const EarningsView = ({ user }: EarningsViewProps) => {
  // Live data for both roles: GET /host/dashboard/earnings (host) or
  // GET /admin/dashboard/earnings (admin). Same matrix/ledger shapes; the
  // admin KPIs swap Active Nodes for Total Refunded and have no occupancy /
  // momentum block.
  const isHost = user.role === 'manager';
  const currency = usePreferredCurrency();
  const [isDownloadingAudit, setIsDownloadingAudit] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Audit Report → host earnings spreadsheet (.xlsx) in the saved currency.
  const handleDownloadAudit = async () => {
    setIsDownloadingAudit(true);
    setAuditError(null);
    try {
      await downloadHostAuditReport({ format: 'xlsx', currency });
    } catch (err) {
      setAuditError(errorMessage(err, 'Failed to download the audit report.'));
    } finally {
      setIsDownloadingAudit(false);
    }
  };
  const now = new Date();
  const [timeframe, setTimeframe] = useState<EarningsTimeframe>('M');
  const [earningsYear, setEarningsYear] = useState(now.getFullYear());
  const [ledgerPage, setLedgerPage] = useState(1);
  const [earnings, setEarnings] = useState<HostEarningsData | AdminEarningsData | null>(null);
  // Narrowed views of `earnings` for the role-specific sections.
  const hostEarnings = earnings && 'operationalOccupancy' in earnings ? earnings : null;
  const adminEarnings = earnings && 'totalRefunded' in earnings.kpis ? (earnings as AdminEarningsData) : null;
  const [isEarningsLoading, setIsEarningsLoading] = useState(false);
  const [earningsError, setEarningsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsEarningsLoading(true);
    setEarningsError(null);
    const params = { timeframe, year: earningsYear, ledgerPage, ledgerLimit: LEDGER_PAGE_SIZE };
    const request: Promise<HostEarningsData | AdminEarningsData> = isHost
      ? getHostEarnings(params)
      : getAdminEarnings({ ...params, currency });
    request
      .then(data => { if (!cancelled) setEarnings(data); })
      .catch(err => { if (!cancelled) setEarningsError(err instanceof Error ? err.message : 'Failed to load earnings.'); })
      .finally(() => { if (!cancelled) setIsEarningsLoading(false); });
    return () => { cancelled = true; };
  }, [isHost, timeframe, earningsYear, ledgerPage, currency]);

  // Year change → back to the first ledger page.
  useEffect(() => { setLedgerPage(1); }, [earningsYear]);

  const matrixRows = earnings?.revenueMatrix.data ?? [];
  const matrixMax = matrixRows.reduce((max, r) => Math.max(max, r.amount), 0);

  return (
    <div className="relative space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Dynamic Background Flair */}
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] opacity-50" />
      <div className="absolute top-1/2 left-0 -z-10 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] opacity-30" />

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-border-misrah/20">
        <div className="space-y-3">
          <Badge variant="gold" className="text-[9px]">Financial Node v2.0</Badge>
          <h1 className="text-5xl md:text-6xl font-sans font-black italic text-primary leading-none uppercase tracking-tighter">Earnings & Yield</h1>
          <p className="text-muted-text text-[10px] font-black uppercase tracking-[4px] opacity-60 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            {user.role === 'admin' ? 'Total Treasury Monitoring' : 'Personal Revenue Analytics'}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <select
              value={earningsYear}
              onChange={e => setEarningsYear(Number(e.target.value))}
              className="py-3 px-4 bg-white border border-border-misrah rounded-2xl text-[10px] font-black uppercase tracking-wider text-primary outline-none focus:border-accent cursor-pointer"
            >
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {isEarningsLoading && <Loader2 size={16} className="animate-spin text-accent" />}
          </div>
          {isHost && (
            <button
              type="button"
              onClick={handleDownloadAudit}
              disabled={isDownloadingAudit}
              title={`Download the earnings audit report (Excel, ${currency})`}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-border-misrah bg-white text-[10px] font-black uppercase tracking-[3px] hover:border-accent hover:shadow-lg transition-all shadow-sm group disabled:opacity-60 disabled:cursor-wait"
            >
              {isDownloadingAudit
                ? <Loader2 size={14} className="animate-spin" />
                : <Download size={14} className="group-hover:-translate-y-0.5 transition-transform" />}
              {isDownloadingAudit ? 'Preparing…' : 'Audit Report'}
            </button>
          )}
        </div>
      </header>
      {auditError && (
        <div className="p-4 rounded-2xl bg-danger/5 border border-danger/20 flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold text-danger">{auditError}</p>
          <button type="button" onClick={() => setAuditError(null)} className="text-[10px] font-black uppercase tracking-wider text-danger/70 hover:text-danger">Dismiss</button>
        </div>
      )}
      {earningsError && (
        <div className="bg-danger/5 border border-danger/20 rounded-3xl p-5 flex items-center gap-3 text-danger">
          <TriangleAlert size={18} />
          <p className="text-[10px] font-black uppercase tracking-widest">Earnings data unavailable: {earningsError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label={`Total Revenue (${earnings?.kpis.totalRevenue.currency ?? 'AED'})`}
          value={earnings ? earnings.kpis.totalRevenue.formattedAmount : '—'}
          change={earnings ? earnings.kpis.totalRevenue.comparisonLabel : '…'}
          icon={Wallet}
          dark
        />
        <StatCard
          label="In Escrow"
          value={earnings ? earnings.kpis.inEscrow.formattedAmount : '—'}
          change={earnings ? earnings.kpis.inEscrow.statusLabel : '…'}
          icon={History}
        />
        <StatCard
          label="Avg. Nightly Rate"
          value={earnings ? earnings.kpis.avgNightlyRate.formattedAmount : '—'}
          change={earnings ? earnings.kpis.avgNightlyRate.seasonalityLabel : '…'}
          icon={TrendingUp}
        />
        {isHost ? (
          <StatCard
            label="Active Nodes"
            value={hostEarnings ? hostEarnings.kpis.activeNodes.count.toString() : '—'}
            change={hostEarnings ? hostEarnings.kpis.activeNodes.statusLabel : '…'}
            icon={CheckCircle2}
          />
        ) : (
          <StatCard
            label={`Total Refunded (${adminEarnings?.kpis.totalRefunded.currency ?? 'AED'})`}
            value={adminEarnings ? adminEarnings.kpis.totalRefunded.formattedAmount : '—'}
            change={adminEarnings ? adminEarnings.kpis.totalRefunded.systemLabel : '…'}
            icon={RotateCcw}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* No fixed heights: the panels share the grid row's height (set by the
            ledger's page + pager). The chart keeps a fixed height at the top of
            the matrix panel; host cards sit at the bottom. */}
        <div className="lg:col-span-3 bg-white rounded-[48px] border border-border-misrah overflow-hidden shadow-sm flex flex-col hover:shadow-luxury transition-all duration-500">
           <div className="p-10 border-b border-border-misrah/50 flex items-center justify-between bg-surface/10 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-accent shadow-lg shadow-primary/20">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-sans font-black italic text-primary uppercase tracking-tight">Revenue Matrix</h2>
                  <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-[4px] mt-1">Cross-Asset Yield Analytics</p>
                </div>
              </div>
              <div className="flex bg-surface p-1.5 rounded-2xl border border-border-misrah/50 shadow-inner group">
                 {(['D', 'W', 'M', 'Y'] as EarningsTimeframe[]).map(t => {
                   const isSelected = timeframe === t;
                   return (
                     <button
                       key={t}
                       type="button"
                       onClick={() => setTimeframe(t)}
                       title={{ D: 'Daily', W: 'Weekly', M: 'Monthly', Y: 'Yearly' }[t]}
                       className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${isSelected ? 'bg-primary text-accent shadow-lg shadow-primary/20' : 'text-muted-text/40 hover:text-primary hover:bg-white'}`}
                     >
                       {t}
                     </button>
                   );
                 })}
              </div>
           </div>
           
           <div className="flex-1 px-10 pt-8 pb-10 flex flex-col overflow-hidden">
              <div className={`flex items-end gap-4 h-80 shrink-0 px-2 ${hostEarnings ? 'mb-12' : ''}`}>
                {matrixRows.length === 0 ? (
                    isEarningsLoading ? (
                      <div className="w-full self-center flex justify-center">
                        <LoadingSpinner />
                      </div>
                    ) : (
                      <p className="w-full self-center text-center text-[10px] font-bold text-muted-text/50 uppercase tracking-widest">
                        No revenue data for this period
                      </p>
                    )
                  ) : matrixRows.map((row, i) => (
                    <div key={`${row.label}-${i}`} className="flex-1 flex flex-col items-center gap-4 group h-full min-w-0" title={`${row.label}: ${row.formattedAmount} ${row.currency} · ${row.bookingsCount} bookings · ${row.occupancyRate}% occupancy`}>
                      <div className="w-full relative bg-surface/50 rounded-2xl overflow-hidden h-full border border-border-misrah/10">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${matrixMax > 0 ? Math.max(2, (row.amount / matrixMax) * 100) : 0}%` }}
                          transition={{ duration: 1, delay: i * 0.05 }}
                          className="absolute inset-x-0 bottom-0 bg-linear-to-t from-primary/30 via-primary/60 to-accent rounded-t-xl group-hover:from-primary group-hover:to-accent transition-all duration-700"
                        />
                      </div>
                      <span className="text-[9px] font-black text-muted-text/30 group-hover:text-primary transition-colors tracking-[1px] uppercase truncate max-w-full">{row.label}</span>
                    </div>
                  ))}
              </div>

              {/* Host only — the admin earnings response has no occupancy /
                  momentum block. */}
              {hostEarnings && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-auto shrink-0">
                <div className="p-8 rounded-[40px] bg-surface/30 border border-border-misrah/50 hover:bg-white hover:shadow-luxury transition-all duration-500 border-b-4 border-b-success/30 relative overflow-hidden group">
                  <div className="relative z-10 flex items-center justify-between mb-8">
                    <span className="text-[10px] font-black text-primary/40 uppercase tracking-[4px]">Operational Occupancy</span>
                    <div className="w-10 h-10 flex items-center justify-center bg-success/10 text-success rounded-xl shadow-inner group-hover:scale-110 group-hover:rotate-12 transition-transform">
                      <ArrowUpRight size={18} />
                    </div>
                  </div>
                  <div className="relative z-10 text-5xl font-sans font-black italic text-primary">
                    {hostEarnings.operationalOccupancy.formattedRate}
                  </div>
                  <div className="relative z-10 text-[9px] font-black text-success uppercase tracking-[3px] mt-4 px-4 py-2 bg-success/10 rounded-full w-fit flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    {`${hostEarnings.operationalOccupancy.totalBookedNights} / ${hostEarnings.operationalOccupancy.totalAvailableNights} nights booked`}
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                </div>
                <div className="p-8 rounded-[40px] bg-surface/30 border border-border-misrah/50 hover:bg-white hover:shadow-luxury transition-all duration-500 border-b-4 border-b-secondary/30 relative overflow-hidden group">
                  <div className="relative z-10 flex items-center justify-between mb-8">
                    <span className="text-[10px] font-black text-primary/40 uppercase tracking-[4px]">Net Yield Momentum</span>
                    <div className="w-10 h-10 flex items-center justify-center bg-secondary/10 text-secondary rounded-xl shadow-inner group-hover:scale-110 group-hover:-rotate-12 transition-transform">
                      <TrendingUp size={18} />
                    </div>
                  </div>
                  <div className="relative z-10 text-5xl font-sans font-black italic text-primary">
                    {hostEarnings.netYieldMomentum.formattedMomentum}
                  </div>
                  <div className="relative z-10 text-[9px] font-black text-secondary uppercase tracking-[3px] mt-4 px-4 py-2 bg-secondary/10 rounded-full w-fit flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    {hostEarnings.netYieldMomentum.isPositive ? 'Positive Momentum' : 'Negative Momentum'}
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                </div>
              </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[48px] border border-border-misrah overflow-hidden shadow-sm flex flex-col hover:shadow-luxury transition-all duration-500">
           <div className="p-10 border-b border-border-misrah/50 flex items-center justify-between bg-surface/10 backdrop-blur-md shrink-0">
              <div>
                <h2 className="text-2xl font-sans font-black italic text-primary uppercase tracking-tight">Ledger</h2>
                <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-[4px] mt-1.5">Asset Protocol History</p>
              </div>
           </div>

           <div className="divide-y divide-border-misrah/30 flex-1">
             <>
                 {(earnings?.ledger.items ?? []).length === 0 ? (
                   isEarningsLoading ? (
                     <div className="p-10 flex justify-center">
                       <LoadingSpinner />
                     </div>
                   ) : (
                     <p className="p-10 text-center text-[10px] font-bold text-muted-text/50 uppercase tracking-widest">
                       No ledger entries for this period
                     </p>
                   )
                 ) : earnings!.ledger.items.map(item => {
                   const isPayout = item.type?.toUpperCase() === 'PAYOUT';
                   const status = item.status?.toUpperCase();
                   return (
                     <div key={item.id} className="px-6 py-4 min-h-20 flex items-center gap-3 hover:bg-surface/50 transition-all group border-l-4 border-l-transparent hover:border-l-accent animate-in fade-in duration-500">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 shrink-0
                         ${isPayout ? 'bg-primary border-primary text-accent shadow-lg shadow-primary/20' : 'bg-surface border-border-misrah text-accent shadow-inner group-hover:bg-white group-hover:border-accent'}`}>
                         {isPayout ? <ArrowDownRight size={16} /> : <Banknote size={16} />}
                       </div>
                       {/* Name gets the remaining width (wraps to 2 lines), then the
                           status, then date · property — each on its own line. */}
                       <div className="flex-1 min-w-0 space-y-1">
                         <p className="text-[11px] font-black text-primary uppercase tracking-tight leading-snug line-clamp-2 break-words" title={item.title}>
                           {item.title}
                         </p>
                         <div>
                           <Badge variant={status === 'COMPLETED' || status === 'CONFIRMED' ? 'green' : 'gold'} className="scale-75 origin-left">{item.status}</Badge>
                         </div>
                         <p className="text-[8px] font-black text-muted-text/50 uppercase tracking-[2px] truncate" title={`${item.formattedDate} · ${item.subtitle}`}>
                           {item.formattedDate} · {item.subtitle}
                         </p>
                       </div>
                       <div className={`text-sm font-sans font-black italic shrink-0 text-right whitespace-nowrap ${isPayout || item.amount < 0 ? 'text-primary' : 'text-accent'}`}>
                         {item.formattedAmount}
                       </div>
                     </div>
                   );
                 })}
               </>
           </div>
           {earnings && earnings.ledger.totalPages > 1 && (
             <div className="p-4 bg-surface/30 border-t border-border-misrah/30 shrink-0 flex items-center justify-between gap-3">
               <button
                 type="button"
                 onClick={() => setLedgerPage(p => Math.max(1, p - 1))}
                 disabled={ledgerPage <= 1 || isEarningsLoading}
                 className="w-10 h-10 rounded-xl bg-white border border-border-misrah flex items-center justify-center text-primary disabled:opacity-40"
               >
                 <ChevronLeft size={16} />
               </button>
               <span className="text-[10px] font-black text-primary uppercase tracking-[3px] text-center">
                 {earnings.ledger.viewFullHistoryLabel} · Page {earnings.ledger.page} / {earnings.ledger.totalPages}
               </span>
               <button
                 type="button"
                 onClick={() => setLedgerPage(p => Math.min(earnings.ledger.totalPages, p + 1))}
                 disabled={ledgerPage >= earnings.ledger.totalPages || isEarningsLoading}
                 className="w-10 h-10 rounded-xl bg-white border border-border-misrah flex items-center justify-center text-primary disabled:opacity-40"
               >
                 <ChevronRight size={16} />
               </button>
             </div>
           )}
        </div>
      </div>

    </div>
  );
};
