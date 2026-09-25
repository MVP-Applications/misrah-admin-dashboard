import React, { useEffect, useState } from 'react';
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, TriangleAlert, Check, X, ArrowRight } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { listAuditLogs } from '../../features/auditLogs/api';
import { approveAdminProperty, getAdminPropertyById } from '../../features/properties/api';
import type { AuditAction, AuditLogEntry } from '../../features/auditLogs/types';

type ActionFilter = 'all' | AuditAction;

const ACTION_TABS: { key: ActionFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'create', label: 'Created' },
  { key: 'update', label: 'Updated' },
  { key: 'delete', label: 'Deleted' },
];

const ACTION_BADGE_VARIANT: Record<AuditAction, string> = {
  create: 'green',
  update: 'gold',
  delete: 'red',
};

const PAGE_SIZE = 20;

// This backend has no per-admin notification concept — this feed repurposes
// the already-live audit log (every create/update/delete across most
// schemas) as platform activity. "Recent" (last 24h) stands in for the
// unread concept the mock UI used to fake, since audit logs have no
// read/unread state. See API_INTEGRATION.md → "Notifications".
function describeChanges(entry: AuditLogEntry): string {
  if (entry.action === 'create') return `A new ${entry.entityType} record was created.`;
  if (entry.action === 'delete') return `A ${entry.entityType} record was removed.`;
  const fields = Object.keys(entry.changes || {});
  if (fields.length === 0) return `${entry.entityType} record was updated.`;
  const shown = fields.slice(0, 3).join(', ');
  const rest = fields.length > 3 ? ` (+${fields.length - 3} more)` : '';
  return `Changed: ${shown}${rest}`;
}

// Only a newly created Property can be approved from the feed — it's the one
// audit entity with a real approve endpoint (PATCH /admin/properties/:id/approve).
const isApprovableEntry = (entry: AuditLogEntry) =>
  entry.action === 'create' && entry.entityType.toLowerCase() === 'property';

// Where "Open" in the details modal should take you, by entity type.
const ENTITY_ROUTES: Record<string, (id: string) => string> = {
  property: (id) => `/admin/hosting/${id}`,
  booking: () => '/bookings',
  review: () => '/reviews',
  banner: () => '/admin/banners',
  propertycategory: () => '/admin/categories',
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export const NotificationsView = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  // entityId → outcome, so the button reflects approvals done this session.
  const [approvedIds, setApprovedIds] = useState<Record<string, 'approved' | 'not-pending'>>({});
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleQuickApprove = async (entry: AuditLogEntry) => {
    setApprovingId(entry.entityId);
    try {
      // The feed entry may be stale — only approve if it's still pending.
      const property = await getAdminPropertyById(entry.entityId);
      if (property.status !== 'pending') {
        setApprovedIds(prev => ({ ...prev, [entry.entityId]: 'not-pending' }));
        showToast(`Property is already ${property.status}.`);
        return;
      }
      await approveAdminProperty(entry.entityId);
      setApprovedIds(prev => ({ ...prev, [entry.entityId]: 'approved' }));
      showToast('Property approved successfully!');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to approve property.');
    } finally {
      setApprovingId(null);
    }
  };

  const fetchLogs = async (targetPage: number, action: ActionFilter) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await listAuditLogs({
        page: targetPage,
        limit: PAGE_SIZE,
        ...(action !== 'all' && { action }),
      });
      setLogs(result.data);
      setTotalPages(result.totalPages);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load activity feed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, actionFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, actionFilter]);

  const handleFilterChange = (filter: ActionFilter) => {
    setActionFilter(filter);
    setPage(1);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-8 right-8 z-[150] bg-primary text-white border border-accent/40 px-6 py-3.5 rounded-2xl shadow-luxury flex items-center gap-3 backdrop-blur-md"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-black italic text-primary uppercase tracking-tighter">Activity Feed</h1>
          <p className="text-muted-text text-sm mt-1 uppercase tracking-widest font-black">Strategic intelligence & Platform updates</p>
        </div>
        <div className="flex gap-2 bg-white border border-border-misrah rounded-2xl p-1.5 shadow-sm">
          {ACTION_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all ${
                actionFilter === tab.key ? 'bg-primary text-accent' : 'text-muted-text hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {loadError && (
        <div className="bg-danger/5 border border-danger/20 rounded-3xl p-8 flex items-center gap-4 text-danger">
          <TriangleAlert size={20} />
          <p className="text-xs font-bold">{loadError}</p>
        </div>
      )}

      {!loadError && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="animate-spin text-primary/40" size={32} />
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-surface border border-border-misrah rounded-3xl p-12 text-center">
              <p className="text-xs font-bold text-muted-text/60 uppercase tracking-widest">No activity found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((entry) => {
                const isRecent = Date.now() - new Date(entry.changedAt).getTime() < 24 * 60 * 60 * 1000;
                return (
                  <div
                    key={entry._id}
                    className={`flex items-start gap-6 p-8 rounded-[40px] border transition-all hover:shadow-luxury
                      ${isRecent ? 'bg-white border-accent shadow-sm' : 'bg-[#FCFAF8]/50 border-border-misrah opacity-80'}`}
                  >
                    <div className={`mt-1.5 w-3 h-3 rounded-full shrink-0 ${isRecent ? 'bg-accent shadow-[0_0_12px_rgba(201,168,76,0.6)]' : 'bg-muted-text/30'}`} />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[13px] font-black text-primary uppercase tracking-tight">
                            {entry.entityType} {entry.action === 'create' ? 'Created' : entry.action === 'delete' ? 'Deleted' : 'Updated'}
                          </h3>
                          <Badge variant={ACTION_BADGE_VARIANT[entry.action]}>{entry.action}</Badge>
                        </div>
                        <span className="text-[9px] font-bold text-muted-text uppercase tracking-widest">
                          {formatDistanceToNowStrict(parseISO(entry.changedAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-[#D4C3B5] font-medium leading-relaxed">{describeChanges(entry)}</p>
                      <p className="text-[9px] font-bold text-muted-text/50 uppercase tracking-widest pt-1">
                        By {entry.changedBy?.name || entry.changedBy?.email || 'System'}
                      </p>

                      <div className="pt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedEntry(entry)}
                          className="px-4 py-2 bg-[#FCFAF8] rounded-xl text-[9px] font-black uppercase tracking-wider text-primary hover:bg-accent hover:text-white transition-all cursor-pointer border border-border-misrah active:scale-95"
                        >
                          View Details
                        </button>

                        {isApprovableEntry(entry) && (
                          approvedIds[entry.entityId] ? (
                            <button
                              type="button"
                              disabled
                              className="px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs cursor-default"
                            >
                              <Check size={12} strokeWidth={3} />
                              <span>{approvedIds[entry.entityId] === 'approved' ? 'Approved' : 'No Longer Pending'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickApprove(entry)}
                              disabled={approvingId === entry.entityId}
                              className="px-4 py-2 bg-primary rounded-xl text-[9px] font-black uppercase tracking-wider text-accent hover:opacity-90 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {approvingId === entry.entityId ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} strokeWidth={3} />}
                              <span>Quick Approve</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-5 py-2.5 rounded-xl border border-border-misrah text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-5 py-2.5 rounded-xl border border-border-misrah text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Details Modal */}
      <AnimatePresence>
        {selectedEntry && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg rounded-[36px] bg-white border border-border-misrah p-8 space-y-6 shadow-2xl relative max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between border-b border-border-misrah/40 pb-4">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-accent">
                    {selectedEntry.entityType} · {selectedEntry.action}
                  </span>
                  <h3 className="text-xl font-black italic uppercase text-primary tracking-tight mt-0.5">
                    {selectedEntry.entityType} {selectedEntry.action === 'create' ? 'Created' : selectedEntry.action === 'delete' ? 'Deleted' : 'Updated'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEntry(null)}
                  className="w-8 h-8 rounded-xl border border-border-misrah flex items-center justify-center text-muted-text hover:text-primary transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-muted-text leading-relaxed">{describeChanges(selectedEntry)}</p>

                <div className="p-4 rounded-2xl bg-surface/60 border border-border-misrah space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-text font-bold">Record ID:</span>
                    <span className="font-mono font-black text-primary truncate">{selectedEntry.entityId}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-text font-bold">Changed By:</span>
                    <span className="font-black text-primary">{selectedEntry.changedBy?.name || selectedEntry.changedBy?.email || 'System'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-text font-bold">When:</span>
                    <span className="font-black text-primary">
                      {format(parseISO(selectedEntry.changedAt), 'dd MMM yyyy, HH:mm')}
                    </span>
                  </div>
                  {selectedEntry.metadata?.ip && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-text font-bold">IP Address:</span>
                      <span className="font-mono font-black text-primary">{selectedEntry.metadata.ip}</span>
                    </div>
                  )}
                </div>

                {selectedEntry.changes && Object.keys(selectedEntry.changes).length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-text">Field Changes</span>
                    <div className="rounded-2xl border border-border-misrah divide-y divide-border-misrah/50 text-[11px]">
                      {(Object.entries(selectedEntry.changes) as Array<[string, { old: unknown; new: unknown } | undefined]>).map(([field, change]) => (
                        <div key={field} className="p-3 space-y-1">
                          <div className="font-black text-primary uppercase tracking-tight">{field}</div>
                          <div className="flex items-start gap-2 text-muted-text break-all">
                            <span className="line-through opacity-70">{formatValue(change?.old)}</span>
                            <ArrowRight size={12} className="shrink-0 mt-0.5 text-accent" />
                            <span className="font-bold text-primary">{formatValue(change?.new)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center gap-3">
                {isApprovableEntry(selectedEntry) && !approvedIds[selectedEntry.entityId] && (
                  <button
                    type="button"
                    onClick={() => handleQuickApprove(selectedEntry)}
                    disabled={approvingId === selectedEntry.entityId}
                    className="flex-1 py-3 bg-primary text-accent rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                  >
                    {approvingId === selectedEntry.entityId ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
                    <span>Approve Property</span>
                  </button>
                )}

                {isApprovableEntry(selectedEntry) && approvedIds[selectedEntry.entityId] && (
                  <div className="flex-1 py-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
                    <Check size={14} strokeWidth={3} />
                    <span>{approvedIds[selectedEntry.entityId] === 'approved' ? 'Approved' : 'No Longer Pending'}</span>
                  </div>
                )}

                {selectedEntry.action !== 'delete' && ENTITY_ROUTES[selectedEntry.entityType.toLowerCase()] && (
                  <button
                    type="button"
                    onClick={() => {
                      const route = ENTITY_ROUTES[selectedEntry.entityType.toLowerCase()](selectedEntry.entityId);
                      setSelectedEntry(null);
                      navigate(route);
                    }}
                    className="px-4 py-3 rounded-xl border border-border-misrah text-xs font-black uppercase tracking-wider text-primary hover:bg-surface transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Open</span>
                    <ArrowRight size={13} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedEntry(null)}
                  className="px-4 py-3 rounded-xl border border-border-misrah text-xs font-black uppercase tracking-wider text-muted-text hover:text-primary transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
