// Backed by a NEW admin controller we added ourselves (misra-api-nest/src/
// modules/review/admin-review.controller.ts) — previously the review module
// had no admin-facing listing or moderation endpoints at all, only consumer
// routes on ReviewController. Response shape matches ReviewService's
// getAllReviewsForAdmin(), a PaginatedDataDto — same
// currentPage/totalCount/totalPages/data convention as bookings, NOT the
// meta:{} convention properties/categories use. See API_INTEGRATION.md →
// "Reviews".

export interface ListReviewsParams {
  page?: number;
  limit?: number;
  propertyId?: string;
  hostId?: string;
  rating?: number;
  status?: 'all' | 'visible' | 'hidden';
}

export interface AdminReviewListItem {
  _id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  // null/absent = visible. A set timestamp = hidden by an admin (soft
  // moderation, mirrors the deletedAt convention used elsewhere in this
  // backend) — never a hard delete.
  deletedAt?: string | null;
  repliesCount: number;
  user: { _id: string; name?: string; email?: string };
  property: { _id: string; title?: string; userId?: string };
}

export interface ListReviewsResponse {
  currentPage: number;
  totalCount: number;
  totalPages: number;
  data: AdminReviewListItem[];
}

// GET /admin/reviews/{id} — a separate shape from AdminReviewListItem: the
// detail endpoint returns the full replies array instead of just a count.
export interface AdminReviewDetail {
  _id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  deletedAt?: string | null;
  user: { _id: string; name?: string; email?: string };
  property: { _id: string; title?: string; userId?: string };
  replies: Array<{ _id: string; message: string; createdAt: string; user?: { _id: string; name?: string; email?: string } }>;
}
