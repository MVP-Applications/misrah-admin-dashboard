import { apiClient } from '../../api/client';
import { assertResponseShape } from '../../api/assertShape';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type {
  AdminHomePageListing,
  CreateHomePageListingRequest,
  UpdateHomePageListingRequest,
  ListAdminHomePageListingsResponse,
  ListTravellerHomePageListingsResponse,
  ManageHostItemsRequest,
  ManagePropertyItemsRequest,
} from './types';

export async function listHomePageListingsAdmin(): Promise<ListAdminHomePageListingsResponse> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ListAdminHomePageListingsResponse>>(
    API_ENDPOINTS.homePageListings.adminAll,
  );
  if (!Array.isArray(data.data)) {
    throw new Error('[homePageListings] admin list response is not an array.');
  }
  return data.data;
}

// Public route, but called from the admin app deliberately — it's the only
// one that returns HOST sections with resolved avatars + computed stats
// (totalProperties/avgRating/totalReviews). See API_INTEGRATION.md →
// "Elite Nodes" for why the admin view still also needs the admin list above.
export async function listHomePageListingsForTraveller(): Promise<ListTravellerHomePageListingsResponse> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ListTravellerHomePageListingsResponse>>(
    API_ENDPOINTS.homePageListings.travellerAll,
  );
  if (!Array.isArray(data.data)) {
    throw new Error('[homePageListings] traveller list response is not an array.');
  }
  return data.data;
}

export async function createHomePageListing(payload: CreateHomePageListingRequest): Promise<AdminHomePageListing> {
  const { data } = await apiClient.post<ApiSuccessEnvelope<AdminHomePageListing>>(
    API_ENDPOINTS.homePageListings.adminAll,
    payload,
  );
  return assertResponseShape('create home page listing', data.data, ['_id', 'title', 'catalogueType']);
}

export async function addHostsToListing(id: string, payload: ManageHostItemsRequest): Promise<AdminHomePageListing> {
  const { data } = await apiClient.post<ApiSuccessEnvelope<AdminHomePageListing>>(
    API_ENDPOINTS.homePageListings.adminHosts(id),
    payload,
  );
  return assertResponseShape('add hosts to listing', data.data, ['_id', 'hostIds']);
}

export async function removeHostsFromListing(id: string, payload: ManageHostItemsRequest): Promise<AdminHomePageListing> {
  const { data } = await apiClient.delete<ApiSuccessEnvelope<AdminHomePageListing>>(
    API_ENDPOINTS.homePageListings.adminHosts(id),
    { data: payload },
  );
  return assertResponseShape('remove hosts from listing', data.data, ['_id', 'hostIds']);
}

// POST/DELETE /home-page-listings/{id}/properties — both return 200 with the
// updated section (same convention as the /hosts routes above).
export async function addPropertiesToListing(id: string, payload: ManagePropertyItemsRequest): Promise<AdminHomePageListing> {
  const { data } = await apiClient.post<ApiSuccessEnvelope<AdminHomePageListing>>(
    API_ENDPOINTS.homePageListings.adminProperties(id),
    payload,
  );
  return assertResponseShape('add properties to listing', data.data, ['_id', 'propertyIds']);
}

export async function removePropertiesFromListing(id: string, payload: ManagePropertyItemsRequest): Promise<AdminHomePageListing> {
  const { data } = await apiClient.delete<ApiSuccessEnvelope<AdminHomePageListing>>(
    API_ENDPOINTS.homePageListings.adminProperties(id),
    { data: payload },
  );
  return assertResponseShape('remove properties from listing', data.data, ['_id', 'propertyIds']);
}

export async function toggleHomePageListingActive(id: string): Promise<AdminHomePageListing> {
  const { data } = await apiClient.patch<ApiSuccessEnvelope<AdminHomePageListing>>(
    API_ENDPOINTS.homePageListings.adminToggleActive(id),
  );
  return assertResponseShape('toggle home page listing', data.data, ['_id', 'isActive']);
}

// PATCH /home-page-listings/{id} and DELETE (soft delete) — both 200. Callers
// refetch the list afterwards, so the response bodies aren't relied on.
export async function updateHomePageListing(id: string, payload: UpdateHomePageListingRequest): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.homePageListings.adminById(id), payload);
}

export async function deleteHomePageListing(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.homePageListings.adminById(id));
}
