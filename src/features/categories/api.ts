import { apiClient } from '../../api/client';
import { assertResponseShape } from '../../api/assertShape';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type {
  ApiCategory,
  CreateCategoryRequest,
  ListCategoriesResponse,
  ManageCategoryPropertiesRequest,
  UpdateCategoryRequest,
} from './types';

const REQUIRED_CATEGORY_FIELDS = ['_id', 'name', 'iconName', 'displayOrder', 'isActive', 'propertyIds'];

export async function listCategories(): Promise<ListCategoriesResponse> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ListCategoriesResponse>>(API_ENDPOINTS.categories.adminAll);
  // Array response — assertResponseShape expects an object with named fields,
  // so just check it's actually an array here instead.
  if (!Array.isArray(data.data)) {
    throw new Error('[categories] list response is not an array — see API_INTEGRATION.md → "Categories".');
  }
  return data.data;
}

export async function createCategory(payload: CreateCategoryRequest): Promise<ApiCategory> {
  const { data } = await apiClient.post<ApiSuccessEnvelope<ApiCategory>>(API_ENDPOINTS.categories.adminAll, payload);
  return assertResponseShape('create category', data.data, REQUIRED_CATEGORY_FIELDS);
}

export async function updateCategory(id: string, payload: UpdateCategoryRequest): Promise<ApiCategory> {
  const { data } = await apiClient.patch<ApiSuccessEnvelope<ApiCategory>>(API_ENDPOINTS.categories.adminById(id), payload);
  return assertResponseShape('update category', data.data, REQUIRED_CATEGORY_FIELDS);
}

// Soft delete (sets deletedAt) — the UI only needs to know it succeeded, then
// refetches the list, so the response body isn't parsed further.
export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.categories.adminById(id));
}

export async function toggleCategoryActive(id: string): Promise<ApiCategory> {
  const { data } = await apiClient.patch<ApiSuccessEnvelope<ApiCategory>>(API_ENDPOINTS.categories.adminToggleActive(id));
  return assertResponseShape('toggle category active', data.data, REQUIRED_CATEGORY_FIELDS);
}

export async function addPropertiesToCategory(
  id: string,
  payload: ManageCategoryPropertiesRequest,
): Promise<ApiCategory> {
  const { data } = await apiClient.post<ApiSuccessEnvelope<ApiCategory>>(
    API_ENDPOINTS.categories.adminProperties(id),
    payload,
  );
  return assertResponseShape('add properties to category', data.data, REQUIRED_CATEGORY_FIELDS);
}

export async function removePropertiesFromCategory(
  id: string,
  payload: ManageCategoryPropertiesRequest,
): Promise<ApiCategory> {
  const { data } = await apiClient.delete<ApiSuccessEnvelope<ApiCategory>>(API_ENDPOINTS.categories.adminProperties(id), {
    data: payload,
  });
  return assertResponseShape('remove properties from category', data.data, REQUIRED_CATEGORY_FIELDS);
}
