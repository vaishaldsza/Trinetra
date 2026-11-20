import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import hi from './locales/hi.json';
import kn from './locales/kn.json';

export const LANGUAGE_STORAGE_KEY = '@trinetra_lang_pref';

export type SupportedLanguage = 'en' | 'hi' | 'kn';

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; label: string; nativeName: string }[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ' }
];

export const resources = {
  en: { translation: en },
  hi: { translation: hi },
  kn: { translation: kn }
} as const;

// Detect device language on first launch
export function getDeviceLanguage(): SupportedLanguage {
  try {
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const languageCode = locales[0].languageCode?.toLowerCase();
      if (languageCode === 'hi') return 'hi';
      if (languageCode === 'kn') return 'kn';
    }
  } catch {
    // Graceful fallback to English
  }
  return 'en';
}

// Initialize i18next synchronously with default, then async hydrate saved preference
i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
} as any);

// Load persisted language choice on startup
export async function initI18n(): Promise<SupportedLanguage> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'en' || saved === 'hi' || saved === 'kn') {
      await i18n.changeLanguage(saved);
      return saved;
    }
    const detected = getDeviceLanguage();
    await i18n.changeLanguage(detected);
    return detected;
  } catch {
    return 'en';
  }
}

export async function changeAppLanguage(lang: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Ignored
  }
}

export function getCurrentLanguage(): SupportedLanguage {
  const current = (i18n.language || 'en').slice(0, 2) as SupportedLanguage;
  return current === 'hi' || current === 'kn' ? current : 'en';
}

// Locale-aware formatting functions using Intl
export function getIntlLocale(lang?: SupportedLanguage): string {
  const code = lang || getCurrentLanguage();
  switch (code) {
    case 'hi':
      return 'hi-IN';
    case 'kn':
      return 'kn-IN';
    default:
      return 'en-IN';
  }
}

export function formatDate(
  date: Date | string,
  optionsOrLang?: Intl.DateTimeFormatOptions | SupportedLanguage
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const lang = typeof optionsOrLang === 'string' ? optionsOrLang : undefined;
  const options = typeof optionsOrLang === 'object' ? optionsOrLang : {
    dateStyle: 'medium',
    timeStyle: 'short'
  };
  const locale = getIntlLocale(lang);
  return new Intl.DateTimeFormat(locale, options as Intl.DateTimeFormatOptions).format(d);
}

export function formatNumber(
  num: number,
  optionsOrLang?: Intl.NumberFormatOptions | SupportedLanguage
): string {
  const lang = typeof optionsOrLang === 'string' ? optionsOrLang : undefined;
  const options = typeof optionsOrLang === 'object' ? optionsOrLang : undefined;
  const locale = getIntlLocale(lang);
  return new Intl.NumberFormat(locale, options).format(num);
}

export function formatBpm(bpm: number | null, lang?: SupportedLanguage): string {
  if (bpm === null) return '--';
  return `${formatNumber(bpm, lang)} ${i18n.t('common.bpm')}`;
}

export function formatDistance(meters: number, lang?: SupportedLanguage): string {
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${formatNumber(Math.round(km * 10) / 10, lang)} km`;
  }
  return `${formatNumber(Math.round(meters), lang)} m`;
}

export default i18n;
