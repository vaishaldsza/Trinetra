import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import kn from './locales/kn.json';

export type WebLanguage = 'en' | 'hi' | 'kn';

export const LANGUAGE_STORAGE_KEY = 'trinetra_lang';

export const resources = {
  en: { translation: en },
  hi: { translation: hi },
  kn: { translation: kn },
} as const;

// Helper to get initial language from localStorage or navigator
export function getSavedLanguage(): WebLanguage {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'en' || saved === 'hi' || saved === 'kn') {
        return saved;
      }
      const navLang = navigator.language?.slice(0, 2);
      if (navLang === 'hi' || navLang === 'kn') return navLang;
    } catch {
      // Ignored
    }
  }
  return 'en';
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
}

export function changeLanguage(lang: WebLanguage): void {
  i18n.changeLanguage(lang);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      document.cookie = `${LANGUAGE_STORAGE_KEY}=${lang};path=/;max-age=31536000`;
    } catch {
      // Ignored
    }
  }
}

export function getIntlLocale(lang?: WebLanguage): string {
  const current = (lang || i18n.language || 'en').slice(0, 2) as WebLanguage;
  switch (current) {
    case 'hi':
      return 'hi-IN';
    case 'kn':
      return 'kn-IN';
    default:
      return 'en-IN';
  }
}

export function formatDate(
  date?: Date | string | null,
  optionsOrLang?: Intl.DateTimeFormatOptions | WebLanguage
): string {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);
    const lang = typeof optionsOrLang === 'string' ? optionsOrLang : undefined;
    const options = typeof optionsOrLang === 'object' ? optionsOrLang : {
      dateStyle: 'medium',
      timeStyle: 'short',
    };
    return new Intl.DateTimeFormat(getIntlLocale(lang), options as Intl.DateTimeFormatOptions).format(d);
  } catch {
    return String(date);
  }
}

export function formatNumber(
  num: number,
  optionsOrLang?: Intl.NumberFormatOptions | WebLanguage
): string {
  const lang = typeof optionsOrLang === 'string' ? optionsOrLang : undefined;
  const options = typeof optionsOrLang === 'object' ? optionsOrLang : undefined;
  return new Intl.NumberFormat(getIntlLocale(lang), options).format(num);
}

export default i18n;
