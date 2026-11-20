import { describe, it, expect } from 'vitest';
import { darkTokens, lightTokens, ColorTokens } from '../theme/tokens';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return { r, g, b };
}

function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const l1 = getLuminance(foregroundHex);
  const l2 = getLuminance(backgroundHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Theme Outdoor Sunlight Contrast & WCAG AA Compliance', () => {
  const palettes: { name: string; tokens: ColorTokens }[] = [
    { name: 'Dark Palette', tokens: darkTokens },
    { name: 'Light Palette', tokens: lightTokens }
  ];

  palettes.forEach(({ name, tokens }) => {
    describe(name, () => {
      it('SOS button text meets WCAG AA contrast (>= 4.5:1)', () => {
        const ratio = getContrastRatio(tokens.sosButtonText, tokens.sosButtonBg);
        expect(ratio, `SOS Button contrast ${ratio.toFixed(2)}:1 below WCAG AA`).toBeGreaterThanOrEqual(4.5);
      });

      it('Fall countdown modal text meets WCAG AA contrast (>= 4.5:1)', () => {
        const ratio = getContrastRatio(tokens.fallCountdownText, tokens.fallCountdownBg);
        expect(ratio, `Fall countdown contrast ${ratio.toFixed(2)}:1 below WCAG AA`).toBeGreaterThanOrEqual(4.5);
      });

      it('Critical triage badge text meets WCAG AA contrast (>= 4.5:1)', () => {
        const ratio = getContrastRatio(tokens.criticalBadgeText, tokens.criticalBadgeBg);
        expect(ratio, `Critical badge contrast ${ratio.toFixed(2)}:1 below WCAG AA`).toBeGreaterThanOrEqual(4.5);
      });

      it('Demo banner text meets WCAG AA contrast (>= 4.5:1)', () => {
        const ratio = getContrastRatio(tokens.demoBannerText, tokens.demoBannerBg);
        expect(ratio, `Demo banner contrast ${ratio.toFixed(2)}:1 below WCAG AA`).toBeGreaterThanOrEqual(4.5);
      });
    });
  });
});
