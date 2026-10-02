// /experience-listings — home page sections of experiences (admin). Shapes
// from a captured GET response + the live OpenAPI spec DTOs.

import type { LocalizedName } from '../categories/types';

export interface ExperienceListing {
  _id: string;
  title: LocalizedName;
  subtitle: LocalizedName;
  displayOrder: number;
  isActive: boolean;
  showOnHomepage: boolean;
  experienceIds: string[];
  experienceCount?: number;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListExperienceListingsParams {
  search?: string;
  isActive?: boolean;
  showOnHomepage?: boolean;
}

// POST /experience-listings (201) and PATCH /experience-listings/{id}.
export interface CreateExperienceListingRequest {
  title: LocalizedName;
  subtitle: LocalizedName;
  displayOrder: number;
  isActive?: boolean;
  showOnHomepage?: boolean;
  experienceIds?: string[];
}

export type UpdateExperienceListingRequest = Partial<CreateExperienceListingRequest>;

export interface ManageListingExperiencesRequest {
  experienceIds: string[];
}
