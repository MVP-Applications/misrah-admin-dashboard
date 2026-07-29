// ---------------------------------------------------------------------------
// Verified against the actual backend source (misra-api-nest), including
// property-category.schema.ts and every method body in property-category.
// service.ts (not just the Swagger @ApiOkResponse examples on the controller,
// which are misleading here — they show a double-nested `{ message, data }`
// response shape that the service methods don't actually produce; the
// services return the raw category document directly, so the real wire shape
// is the same single-level envelope used everywhere else in this app:
// { success, message: 'Success', data: <category>, timestamp, responseTime }).
//
// iconName: confirmed from src/database/seeds/property-category.seeder.ts —
// every real seeded category has iconName as a lowercase, space-free slug of
// name.en ('City' -> 'city', 'Beach' -> 'beach', 'Cultural' -> 'cultural',
// etc.). It's required by the API but NOT validated beyond non-empty string —
// presumably the mobile app looks up a static icon asset by this exact slug.
// This app auto-derives it from name.en rather than exposing a manual field,
// matching the established convention. See API_INTEGRATION.md → "Categories"
// for the caveat this implies (a brand-new category type has no guarantee the
// mobile app has a matching icon asset for its auto-derived slug).
// ---------------------------------------------------------------------------

export interface LocalizedName {
  en: string;
  ar: string;
}

export interface ApiCategory {
  _id: string;
  name: LocalizedName;
  iconName: string;
  iconUrl?: string | null;
  displayOrder: number;
  isActive: boolean;
  propertyIds: string[];
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// findAll() takes no query params and returns a plain array — no pagination
// wrapper, unlike bookings/properties.
export type ListCategoriesResponse = ApiCategory[];

export interface CreateCategoryRequest {
  name: LocalizedName;
  iconName: string;
  iconUrl?: string;
  displayOrder: number;
  isActive?: boolean;
}

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;

export interface ManageCategoryPropertiesRequest {
  propertyIds: string[];
}
