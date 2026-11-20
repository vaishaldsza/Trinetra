'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (t: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'dark',
  setTheme: () => {},
});

export const THEME_STORAGE_KEY = 'trinetra_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

  // Compute resolved theme based on preference and media query
  const getSystemTheme = (): ResolvedTheme => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const applyTheme = (pref: ThemePreference) => {
    const root = document.documentElement;
    const resolved = pref === 'system' ? getSystemTheme() : pref;
    setResolvedTheme(resolved);

    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  useEffect(() => {
    let saved: ThemePreference = 'system';
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        saved = stored;
      }
    } catch {}

    setThemeState(saved);
    applyTheme(saved);

    // Watch for system color scheme changes if mode is 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      try {
        const current = localStorage.getItem(THEME_STORAGE_KEY) || 'system';
        if (current === 'system') {
          applyTheme('system');
        }
      } catch {}
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = (newTheme: ThemePreference) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {}
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options: { mode: ThemePreference; icon: typeof Sun; label: string }[] = [
    { mode: 'light', icon: Sun, label: 'Light' },
    { mode: 'dark', icon: Moon, label: 'Dark' },
    { mode: 'system', icon: Laptop, label: 'System' },
  ];

  return (
    <div
      className="inline-flex items-center gap-0.5 bg-slate-800/60 dark:bg-slate-800/60 rounded-lg p-0.5 border border-slate-700/60 dark:border-slate-700/60 text-xs"
      role="radiogroup"
      aria-label="Color theme"
    >
      {options.map((opt) => {
        const isSelected = theme === opt.mode;
        const IconComponent = opt.icon;
        return (
          <button
            key={opt.mode}
            type="button"
            onClick={() => setTheme(opt.mode)}
            className={`p-1.5 rounded transition ${
              isSelected
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
            title={opt.label}
            aria-checked={isSelected}
            role="radio"
          >
            <IconComponent className="w-3.5 h-3.5" />
          </button>
        );
      })}
    </div>
  );
}
