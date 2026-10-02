import { apiClient } from '../../api/client';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type {
  CreateExperienceListingRequest,
  ExperienceListing,
  ListExperienceListingsParams,
  ManageListingExperiencesRequest,
  UpdateExperienceListingRequest,
} from './types';

// GET /experience-listings?search&isActive&showOnHomepage — captured response
// is { message, data: [...] }.
export async function listExperienceListings(params: ListExperienceListingsParams = {}): Promise<ExperienceListing[]> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<ExperienceListing[]>>(API_ENDPOINTS.experienceListings.adminAll, {
    params,
  });
  if (!Array.isArray(data.data)) {
    throw new Error('[experience-listings] list response is not an array.');
  }
  return data.data;
}

// Mutations below: responses aren't relied on — the caller refetches the list.
export async function createExperienceListing(payload: CreateExperienceListingRequest): Promise<void> {
  await apiClient.post(API_ENDPOINTS.experienceListings.adminAll, payload);
}

export async function updateExperienceListing(id: string, payload: UpdateExperienceListingRequest): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.experienceListings.adminById(id), payload);
}

export async function deleteExperienceListing(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.experienceListings.adminById(id));
}

export async function toggleExperienceListingActive(id: string): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.experienceListings.adminToggleActive(id));
}

export async function toggleExperienceListingHomepage(id: string): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.experienceListings.adminToggleHomepage(id));
}

export async function addExperiencesToListing(id: string, payload: ManageListingExperiencesRequest): Promise<void> {
  await apiClient.post(API_ENDPOINTS.experienceListings.adminExperiences(id), payload);
}

export async function removeExperiencesFromListing(id: string, payload: ManageListingExperiencesRequest): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.experienceListings.adminExperiences(id), { data: payload });
}
