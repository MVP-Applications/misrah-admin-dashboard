import { apiClient } from '../../api/client';
import { assertResponseShape } from '../../api/assertShape';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type {
  AdminReviewDetail,
  AdminReviewListItem,
  HostReviewsResult,
  ListHostReviewsParams,
  ListReviewsParams,
  ListReviewsResponse,
} from './types';

export async function listReviews(params: ListReviewsParams = {}): Promise<ListReviewsResponse> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ListReviewsResponse>>(API_ENDPOINTS.reviews.adminAll, {
    params,
  });
  return assertResponseShape('list reviews', data.data, ['data', 'currentPage', 'totalCount', 'totalPages']);
}

export async function getReviewById(id: string): Promise<AdminReviewDetail> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<AdminReviewDetail>>(API_ENDPOINTS.reviews.adminById(id));
  return assertResponseShape('review detail', data.data, ['_id', 'rating', 'user', 'property']);
}

export async function hideReview(id: string): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.reviews.adminHide(id));
}

export async function restoreReview(id: string): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.reviews.adminRestore(id));
}

// GET /review/host — host's own reviews. Captured response is double-nested:
// { success, data: { message, data: { overallRating, reviews: { currentPage,
// totalCount, totalPages, data: [...] } } } }. Items carry inline `replies`,
// so repliesCount is derived from them.
export async function listHostReviews(params: ListHostReviewsParams = {}): Promise<HostReviewsResult> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<{ data?: Record<string, any> } & Record<string, any>>>(
    API_ENDPOINTS.reviews.host,
    { params },
  );
  const inner = (data.data?.data ?? data.data) as Record<string, any>;
  const page = inner?.reviews;
  if (!page || !Array.isArray(page.data)) {
    throw new Error('[reviews] host reviews response has an unexpected shape.');
  }
  return {
    overallRating: {
      averageRating: Number(inner.overallRating?.averageRating) || 0,
      totalReviews: Number(inner.overallRating?.totalReviews) || 0,
    },
    currentPage: page.currentPage ?? params.page ?? 1,
    totalCount: page.totalCount ?? page.data.length,
    totalPages: page.totalPages ?? 1,
    data: (page.data as AdminReviewListItem[]).map(r => ({
      ...r,
      repliesCount: Array.isArray(r.replies) ? r.replies.length : r.repliesCount ?? 0,
    })),
  };
}

// PATCH /review/{id}/reply — { message } (200). Response not relied on; the
// caller refetches so the new reply comes back from the server.
export async function replyToReview(id: string, message: string): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.reviews.reply(id), { message });
}
