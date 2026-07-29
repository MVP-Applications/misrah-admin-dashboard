import { apiClient } from '../../api/client';
import { assertResponseShape } from '../../api/assertShape';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type {
  AdminHomePageListing,
  ListAdminHomePageListingsResponse,
  ListTravellerHomePageListingsResponse,
  ManageHostItemsRequest,
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
