// Mirrors the categories feature exactly — this backend module
// (misra-api-nest/src/modules/banner/) was built by this project specifically
// to match property-category's shape/conventions. See API_INTEGRATION.md →
// "Banners".
export interface LocalizedName {
  en: string;
  ar: string;
}

export interface ApiBanner {
  _id: string;
  title: LocalizedName;
  imageUrl: string;
  link: string;
  displayOrder: number;
  isActive: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// findAll() takes no query params and returns a plain array — no pagination
// wrapper, same as categories.
export type ListBannersResponse = ApiBanner[];

export interface CreateBannerRequest {
  title: LocalizedName;
  imageUrl: string;
  link: string;
  displayOrder: number;
  isActive?: boolean;
}

export type UpdateBannerRequest = Partial<CreateBannerRequest>;
