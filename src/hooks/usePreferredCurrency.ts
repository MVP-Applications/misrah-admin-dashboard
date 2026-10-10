import { useEffect, useState } from 'react';
import { getPreferredCurrency, subscribePreferredCurrency } from '../api/currency';

// The user's saved currency (from the profile), kept in sync — re-renders
// when it loads after login or the user switches it in Profile.
export function usePreferredCurrency(): string {
  const [code, setCode] = useState<string | null>(getPreferredCurrency());
  useEffect(() => {
    setCode(getPreferredCurrency());
    return subscribePreferredCurrency(setCode);
  }, []);
  return code || 'AED';
}
