// Verified against misra-api-nest/src/modules/user/ — AdminUserController,
// user.schema.ts, find-users-query.dto.ts. Note the pagination wrapper here
// is flat (`data, total, page, limit, totalPages`) — a THIRD distinct
// convention in this backend, different from both bookings'
// (`data, currentPage, totalCount, totalPages`) and properties/categories'
// (`data, meta: { total, page, limit, totalPages }`). Don't copy-paste either
// of those here.
export interface AdminUserRecord {
  _id: string;
  email?: string;
  name?: string;
  phoneNumber?: string;
  userType: 'consumer' | 'admin';
  isActive: boolean;
  canHost: boolean;
  isSuperHost?: boolean;
  mode?: 'TRAVELER' | 'HOST';
  hostSince?: string | null;
  createdAt: string;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  userType?: 'consumer' | 'admin';
}

export interface ListUsersResponse {
  data: AdminUserRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Confirmed from UpdateConsumerUserDto (PartialType of CreateConsumerUserDto).
// isSuperHost was added to CreateConsumerUserDto by this project — it wasn't
// settable via any admin endpoint before.
export interface UpdateConsumerUserRequest {
  name?: string;
  isActive?: boolean;
  canHost?: boolean;
  isSuperHost?: boolean;
}
