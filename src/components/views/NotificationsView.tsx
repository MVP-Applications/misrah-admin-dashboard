import React, { useEffect, useState } from 'react';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { Loader2, TriangleAlert } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { listAuditLogs } from '../../features/auditLogs/api';
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

export const NotificationsView = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
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
    </div>
  );
};
