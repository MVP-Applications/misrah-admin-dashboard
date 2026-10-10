import { getPreferredCurrency } from '../api/currency';

// Currency code to show next to an amount: the one the API returned the
// amount in (price-bearing routes are converted to the user's preferred
// currency), else the user's preferred currency, else AED.
export function displayCurrency(code?: string | null): string {
  return (code && code.trim().toUpperCase()) || getPreferredCurrency() || 'AED';
}

// "AED 1,250" / "USD 340.5"
export function formatMoney(amount: number | null | undefined, code?: string | null): string {
  const value = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  return `${displayCurrency(code)} ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
