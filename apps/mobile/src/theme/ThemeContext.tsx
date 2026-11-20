import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorTokens, ThemePreference, darkTokens, lightTokens } from './tokens';

const THEME_STORAGE_KEY = '@trinetra_theme_pref';

interface ThemeContextType {
  themePreference: ThemePreference;
  isDark: boolean;
  colors: ColorTokens;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  themePreference: 'system',
  isDark: true,
  colors: darkTokens,
  setThemePreference: async () => {}
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Load stored preference from AsyncStorage on startup
    const loadPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setThemePreferenceState(stored);
        }
      } catch {
        // Fall back to system preference on storage error
      } finally {
        setIsReady(true);
      }
    };
    loadPreference();
  }, []);

  const setThemePreference = async (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, pref);
    } catch {
      // Ignored
    }
  };

  const isDark =
    themePreference === 'dark'
      ? true
      : themePreference === 'light'
      ? false
      : systemColorScheme !== 'light';

  const colors = isDark ? darkTokens : lightTokens;

  return (
    <ThemeContext.Provider
      value={{
        themePreference,
        isDark,
        colors,
        setThemePreference
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}
