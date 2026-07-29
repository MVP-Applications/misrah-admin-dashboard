import { apiClient } from '../../api/client';
import { assertResponseShape } from '../../api/assertShape';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type { AdminReviewDetail, ListReviewsParams, ListReviewsResponse } from './types';

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
