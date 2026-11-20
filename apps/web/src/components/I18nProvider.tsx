'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useTranslation, I18nextProvider } from 'react-i18next';
import i18n, { WebLanguage, changeLanguage, getSavedLanguage, formatDate, formatNumber } from '../i18n';
import { Globe, ChevronDown, Check } from 'lucide-react';

interface I18nContextValue {
  language: WebLanguage;
  setLanguage: (lang: WebLanguage) => void;
  formatDate: (date?: Date | string | null, optionsOrLang?: Intl.DateTimeFormatOptions | WebLanguage) => string;
  formatNumber: (num: number, optionsOrLang?: Intl.NumberFormatOptions | WebLanguage) => string;
}

const I18nContext = createContext<I18nContextValue>({
  language: 'en',
  setLanguage: () => {},
  formatDate,
  formatNumber,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [currentLang, setCurrentLang] = useState<WebLanguage>('en');

  useEffect(() => {
    const saved = getSavedLanguage();
    setCurrentLang(saved);
    if (i18n.language !== saved) {
      changeLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: WebLanguage) => {
    setCurrentLang(lang);
    changeLanguage(lang);
  };

  return (
    <I18nextProvider i18n={i18n}>
      <I18nContext.Provider
        value={{
          language: currentLang,
          setLanguage: handleSetLanguage,
          formatDate,
          formatNumber,
        }}
      >
        {children}
      </I18nContext.Provider>
    </I18nextProvider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  const { t } = useTranslation();
  return {
    ...context,
    t,
  };
}

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options: { code: WebLanguage; label: string; subLabel: string; fontClass?: string }[] = [
    { code: 'en', label: 'English', subLabel: 'English' },
    { code: 'hi', label: 'हिन्दी', subLabel: 'Hindi', fontClass: 'font-devanagari' },
    { code: 'kn', label: 'ಕನ್ನಡ', subLabel: 'Kannada', fontClass: 'font-kannada' },
  ];

  const currentOption = options.find((opt) => opt.code === language) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold transition shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('languages.select_language')}
      >
        <Globe className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
        <span className={`${currentOption.fontClass || ''} font-medium tracking-tight`}>
          {currentOption.label}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          role="listbox"
          aria-label={t('languages.select_language')}
          className="absolute right-0 mt-1.5 w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
            {t('languages.select_language')}
          </div>
          {options.map((opt) => {
            const isSelected = language === opt.code;
            return (
              <button
                key={opt.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setLanguage(opt.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition ${
                  isSelected
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex flex-col">
                  <span className={`${opt.fontClass || ''} text-sm font-semibold leading-tight`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal">
                    {opt.subLabel}
                  </span>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
