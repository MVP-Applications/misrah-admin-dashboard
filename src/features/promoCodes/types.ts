// Promo codes — admin-managed discount codes for bookings.
// NO BACKEND YET: the live OpenAPI spec has no promo-code routes, so
// ./api.ts persists to localStorage. These shapes are what that module (and
// a future real API) exchange.

export type PromoDiscountType = 'PERCENTAGE' | 'FIXED';
export type PromoAppliesTo = 'ALL' | 'STAYS' | 'EXPERIENCES';

export interface PromoCode {
  _id: string;
  code: string; // stored upper-case, unique
  description?: string;
  discountType: PromoDiscountType;
  discountValue: number; // % (1–100) or fixed amount
  maxDiscountAmount?: number | null; // cap for PERCENTAGE codes
  minBookingAmount?: number | null;
  currency: string;
  appliesTo: PromoAppliesTo;
  validFrom: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
  usageLimit?: number | null; // total redemptions, null = unlimited
  perUserLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreatePromoCodeRequest = Omit<PromoCode, '_id' | 'usedCount' | 'createdAt' | 'updatedAt'>;
export type UpdatePromoCodeRequest = Partial<CreatePromoCodeRequest>;

export interface ListPromoCodesParams {
  search?: string;
  isActive?: boolean;
}
