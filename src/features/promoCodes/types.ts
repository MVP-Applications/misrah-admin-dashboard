// Promo codes — admin CRUD on /admin/promo-codes (live OpenAPI spec:
// CreatePromoCodeDto / UpdatePromoCodeDto). The UI works with `PromoCode`
// below; ./api.ts maps it to/from the wire shape (`ApiPromoCode`), which
// names the limits totalUsageLimit / usesPerGuest and uses ISO date-times.

export type PromoDiscountType = 'PERCENTAGE' | 'FIXED';
export type PromoAppliesTo = 'ALL' | 'STAYS' | 'EXPERIENCES';

export interface PromoCode {
  _id: string;
  code: string; // upper-case (normalized by the backend)
  description?: string;
  discountType: PromoDiscountType;
  discountValue: number; // % (1–100) or fixed amount
  maxDiscountAmount?: number | null; // cap for PERCENTAGE codes
  minBookingAmount?: number | null;
  currency: string;
  appliesTo: PromoAppliesTo;
  validFrom: string; // YYYY-MM-DD (UI)
  validUntil: string; // YYYY-MM-DD (UI)
  usageLimit?: number | null; // ↔ totalUsageLimit, null = unlimited
  perUserLimit?: number | null; // ↔ usesPerGuest, null = unlimited
  usedCount: number;
  isActive: boolean;
  // Server-computed: active / inactive / expired / scheduled / ... (lower-case).
  computedStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreatePromoCodeRequest = Omit<PromoCode, '_id' | 'usedCount' | 'createdAt' | 'updatedAt' | 'computedStatus'>;
export type UpdatePromoCodeRequest = Partial<CreatePromoCodeRequest>;

export interface ListPromoCodesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string; // e.g. 'active' | 'inactive'
  appliesTo?: PromoAppliesTo;
  discountType?: PromoDiscountType;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ListPromoCodesResult {
  data: PromoCode[];
  totalCount: number;
  totalPages: number;
}

// Wire shape (create response example in the spec).
export interface ApiPromoCode {
  _id: string;
  code: string;
  description?: string;
  appliesTo: PromoAppliesTo;
  discountType: PromoDiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minBookingAmount?: number | null;
  validFrom: string;
  validUntil: string;
  totalUsageLimit?: number | null;
  usesPerGuest?: number | null;
  usedCount?: number;
  isActive: boolean;
  currency?: string;
  computedStatus?: string;
  createdAt: string;
  updatedAt: string;
}
