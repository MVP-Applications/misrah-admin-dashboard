import React, { useEffect, useState } from 'react';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { Trash2, Undo2, Star, Loader2, TriangleAlert, EyeOff } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { User } from '../../types';
import { listReviews, hideReview, restoreReview } from '../../features/reviews/api';
import type { AdminReviewListItem } from '../../features/reviews/types';

interface ReviewsViewProps {
  user: User;
}

type StatusFilter = 'all' | 'visible' | 'hidden';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'visible', label: 'Visible' },
  { key: 'hidden', label: 'Hidden' },
];

const PAGE_SIZE = 12;

export const ReviewsView = ({ user }: ReviewsViewProps) => {
  const [reviews, setReviews] = useState<AdminReviewListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const fetchReviews = async (targetPage: number, status: StatusFilter) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [listResult, hiddenResult] = await Promise.all([
        listReviews({ page: targetPage, limit: PAGE_SIZE, status }),
        // Kept separate from the main filtered query so the "Hidden" count in
        // the sidebar stays accurate regardless of which tab is active.
        listReviews({ page: 1, limit: 1, status: 'hidden' }),
      ]);
      setReviews(listResult.data);
      setTotalCount(listResult.totalCount);
      setTotalPages(listResult.totalPages);
      setHiddenCount(hiddenResult.totalCount);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load reviews.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(page, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleStatusFilterChange = (status: StatusFilter) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleToggleHidden = async (review: AdminReviewListItem) => {
    setMutatingId(review._id);
    setActionError(null);
    try {
      if (review.deletedAt) {
        await restoreReview(review._id);
      } else {
        await hideReview(review._id);
      }
      await fetchReviews(page, statusFilter);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update review visibility.');
    } finally {
      setMutatingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black italic text-primary uppercase tracking-tighter leading-none">Guest Sentiment</h1>
          <p className="text-muted-text text-[10px] font-black uppercase tracking-[3px] mt-2 opacity-60">Verified Community Feedback</p>
        </div>
        <div className="flex gap-2 bg-white border border-border-misrah rounded-2xl p-1.5 shadow-sm">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleStatusFilterChange(tab.key)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all ${
                statusFilter === tab.key ? 'bg-primary text-accent' : 'text-muted-text hover:text-primary'
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#1A2B47] rounded-[40px] p-8 text-center border border-primary/10 shadow-xl shadow-primary/20">
              <p className="text-[10px] font-black text-accent uppercase tracking-[2px] mb-4">Moderation Overview</p>
              <div className="text-7xl font-black italic text-white leading-none">{totalCount}</div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mt-3">Total Reviews</p>
              <div className="flex items-center justify-center gap-2 mt-6 text-white/60">
                <EyeOff size={14} />
                <span className="text-xs font-bold">{hiddenCount} hidden</span>
              </div>
            </div>

            {actionError && (
              <div className="bg-danger/5 border border-danger/20 rounded-2xl p-4 flex items-center gap-3 text-danger">
                <TriangleAlert size={16} />
                <p className="text-[10px] font-black uppercase tracking-widest">{actionError}</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-3 space-y-6 pb-12">
            {isLoading ? (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="animate-spin text-primary/40" size={32} />
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-surface border border-border-misrah rounded-3xl p-12 text-center">
                <p className="text-xs font-bold text-muted-text/60 uppercase tracking-widest">No reviews found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((review) => {
                  const isHidden = Boolean(review.deletedAt);
                  return (
                    <div
                      key={review._id}
                      className={`bg-white rounded-[40px] border p-8 flex flex-col justify-between shadow-sm hover:shadow-luxury transition-all group ${
                        isHidden ? 'border-danger/30 opacity-70' : 'border-border-misrah'
                      }`}
                    >
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${review.user._id}`}
                              className="w-12 h-12 rounded-2xl object-cover border-2 border-surface shadow-sm"
                              alt={review.user.name}
                            />
                            <div>
                              <h4 className="text-[13px] font-black text-primary uppercase tracking-tight">
                                {review.user.name || review.user.email || 'Unknown Guest'}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="flex text-accent scale-75 origin-left">{'★'.repeat(review.rating)}</div>
                                <span className="text-[9px] font-bold text-muted-text uppercase">
                                  {formatDistanceToNowStrict(parseISO(review.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          </div>
                          {user.role === 'admin' && (
                            <button
                              onClick={() => handleToggleHidden(review)}
                              disabled={mutatingId === review._id}
                              title={isHidden ? 'Restore review' : 'Hide review'}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm disabled:opacity-50 ${
                                isHidden
                                  ? 'bg-success/10 text-success hover:bg-success hover:text-white'
                                  : 'bg-danger/5 text-danger opacity-0 group-hover:opacity-100 hover:bg-danger hover:text-white shadow-danger/10'
                              }`}
                            >
                              {mutatingId === review._id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : isHidden ? (
                                <Undo2 size={14} />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-accent uppercase tracking-[1px] opacity-80">
                            {review.property.title || 'Unknown Property'}
                          </p>
                          {review.comment && (
                            <p className="text-[13px] font-medium leading-relaxed text-primary/80 italic line-clamp-3">
                              "{review.comment}"
                            </p>
                          )}
                        </div>

                        {isHidden && (
                          <div className="flex gap-2 pt-2">
                            <Badge variant="gray">Hidden</Badge>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-8 pt-6 border-t border-border-misrah/50">
                        <Star size={14} className="text-muted-text/40" />
                        <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest">
                          {review.repliesCount} {review.repliesCount === 1 ? 'reply' : 'replies'}
                        </span>
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
          </div>
        </div>
      )}
    </div>
  );
};
