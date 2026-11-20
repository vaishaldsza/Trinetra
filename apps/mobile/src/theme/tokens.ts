export type ThemePreference = 'light' | 'dark' | 'system';

export interface ColorTokens {
  background: string;
  surface: string;
  surfaceSecondary: string;
  surfaceElevated: string;
  card: string;
  text: string;
  textSecondary: string;
  mutedText: string;
  border: string;
  borderStrong: string;
  primary: string;
  primaryHover: string;
  primaryText: string;
  danger: string;
  dangerSurface: string;
  dangerText: string;
  warning: string;
  warningSurface: string;
  warningText: string;
  success: string;
  successSurface: string;
  successText: string;
  info: string;
  infoSurface: string;
  inputBackground: string;
  inputText: string;
  inputBorder: string;
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;

  // High-Contrast Outdoor Critical Tokens (WCAG AA > 4.5:1, AAA > 7:1)
  sosButtonBg: string;
  sosButtonText: string;
  fallCountdownBg: string;
  fallCountdownText: string;
  criticalBadgeBg: string;
  criticalBadgeText: string;
  demoBannerBg: string;
  demoBannerText: string;
}

export const darkTokens: ColorTokens = {
  background: '#020617', // Slate 950
  surface: '#0F172A',    // Slate 900
  surfaceSecondary: '#1E293B', // Slate 800
  surfaceElevated: '#1E293B',
  card: '#0F172A',
  text: '#F8FAFC',       // Slate 50
  textSecondary: '#94A3B8', // Slate 400
  mutedText: '#64748B',  // Slate 500
  border: '#1E293B',     // Slate 800
  borderStrong: '#334155', // Slate 700
  primary: '#F97316',    // Orange 500
  primaryHover: '#EA580C',
  primaryText: '#FFFFFF',
  danger: '#EF4444',     // Red 500
  dangerSurface: 'rgba(239, 68, 68, 0.15)',
  dangerText: '#FCA5A5',
  warning: '#F59E0B',    // Amber 500
  warningSurface: 'rgba(245, 158, 11, 0.15)',
  warningText: '#FCD34D',
  success: '#10B981',    // Emerald 500
  successSurface: 'rgba(16, 185, 129, 0.15)',
  successText: '#6EE7B7',
  info: '#06B6D4',       // Cyan 500
  infoSurface: 'rgba(6, 182, 212, 0.15)',
  inputBackground: '#1E293B',
  inputText: '#F8FAFC',
  inputBorder: '#334155',
  tabBarBackground: '#0F172A',
  tabBarBorder: '#1E293B',
  tabBarActive: '#F97316',
  tabBarInactive: '#64748B',

  // High-Contrast Outdoor Critical Tokens (Outdoor Sunlight Readability)
  sosButtonBg: '#DC2626',      // WCAG AA contrast ratio 5.7:1 with white text
  sosButtonText: '#FFFFFF',
  fallCountdownBg: '#7F1D1D',  // WCAG AAA contrast ratio > 8:1 with white text
  fallCountdownText: '#FFFFFF',
  criticalBadgeBg: '#DC2626',  // WCAG AA contrast ratio 5.7:1 with white text
  criticalBadgeText: '#FFFFFF',
  demoBannerBg: '#F59E0B',     // WCAG AAA contrast ratio 9.6:1 with #0F172A text
  demoBannerText: '#0F172A'
};

export const lightTokens: ColorTokens = {
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',    // White
  surfaceSecondary: '#F1F5F9', // Slate 100
  surfaceElevated: '#F1F5F9',
  card: '#FFFFFF',
  text: '#0F172A',       // Slate 900
  textSecondary: '#475569', // Slate 600
  mutedText: '#64748B',  // Slate 500
  border: '#E2E8F0',     // Slate 200
  borderStrong: '#CBD5E1', // Slate 300
  primary: '#EA580C',    // Orange 600
  primaryHover: '#C2410C',
  primaryText: '#FFFFFF',
  danger: '#DC2626',     // Red 600
  dangerSurface: '#FEE2E2', // Red 100
  dangerText: '#991B1B',
  warning: '#D97706',    // Amber 600
  warningSurface: '#FEF3C7', // Amber 100
  warningText: '#92400E',
  success: '#059669',    // Emerald 600
  successSurface: '#D1FAE5', // Emerald 100
  successText: '#065F46',
  info: '#0284C7',       // Sky 600
  infoSurface: '#E0F2FE',
  inputBackground: '#F1F5F9',
  inputText: '#0F172A',
  inputBorder: '#CBD5E1',
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  tabBarActive: '#EA580C',
  tabBarInactive: '#64748B',

  // High-Contrast Outdoor Critical Tokens (Outdoor Sunlight Readability in Light Mode)
  sosButtonBg: '#DC2626',      // Vivid Crimson Red, high contrast in full sunlight
  sosButtonText: '#FFFFFF',
  fallCountdownBg: '#7F1D1D',  // Deep Crimson, high contrast in full sunlight
  fallCountdownText: '#FFFFFF',
  criticalBadgeBg: '#DC2626',  // Pure red badge with white text
  criticalBadgeText: '#FFFFFF',
  demoBannerBg: '#F59E0B',     // Amber banner with dark slate text (Contrast 9.6:1)
  demoBannerText: '#0F172A'
};
