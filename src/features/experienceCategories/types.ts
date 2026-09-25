// Request shapes mirror CreateExperienceCategoryDto / UpdateExperienceCategoryDto
// from the live OpenAPI spec (https://misra-test.mvp-apps.ae/api-json). Only
// `name` is required on create; slug is auto-generated server-side if omitted.
//
// The response document shape is NOT documented in the spec (it only says
// "Paginated list of experience categories") — ApiExperienceCategoryRecord
// below mirrors the DTO fields plus the usual _id/timestamps, and only
// _id/name are relied on unconditionally.

import type { LocalizedName } from '../categories/types';

export interface ApiExperienceCategoryRecord {
  _id: string;
  name: LocalizedName;
  slug?: string;
  iconName?: string;
  iconUrl?: string | null;
  // Not in the create/update DTOs — only rendered if the backend ever returns it.
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExperienceCategoryRequest {
  name: LocalizedName;
  slug?: string;
  iconName?: string;
  iconUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export type UpdateExperienceCategoryRequest = Partial<CreateExperienceCategoryRequest>;

export interface ListExperienceCategoriesAdminParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}
