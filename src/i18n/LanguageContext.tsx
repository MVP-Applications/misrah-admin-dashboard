import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ar, en, type TranslationKey } from './translations';

// App-wide language. 'ar' switches the whole document to RTL (html dir/lang),
// the Arabic font (see index.css `html[lang="ar"]`) and the `ar` strings.
// Persisted per browser so the choice survives reloads and applies on login.

export type Language = 'en' | 'ar';

const STORAGE_KEY = 'misrah_language';

const readStoredLanguage = (): Language => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'ar' ? 'ar' : 'en';
  } catch {
    return 'en';
  }
};

// Applied before React renders so there's no flash of LTR on reload.
export function applyDocumentLanguage(lang: Language): void {
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

// Module-level getter for non-React code (e.g. the API client's
// Accept-Language header).
let currentLanguage: Language = readStoredLanguage();
export const getCurrentLanguage = () => currentLanguage;

interface LanguageContextValue {
  language: Language;
  isRtl: boolean;
  setLanguage: (lang: Language) => void;
  // t('key') or t('key', { name: 'x' }) — {placeholders} are replaced.
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider = ({ children }: { children?: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);

  useEffect(() => {
    currentLanguage = language;
    applyDocumentLanguage(language);
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // storage unavailable — keep the in-memory choice
    }
  }, [language]);

  const setLanguage = useCallback((lang: Language) => setLanguageState(lang), []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let text: string = (language === 'ar' ? ar[key] : en[key]) ?? en[key] ?? key;
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.split(`{${name}}`).join(String(value));
        }
      }
      return text;
    },
    [language],
  );

  const value = useMemo(() => ({ language, isRtl: language === 'ar', setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>.');
  return ctx;
}

// Apply the stored language immediately at import time (before first paint).
applyDocumentLanguage(currentLanguage);
