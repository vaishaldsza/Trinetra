import { describe, it, expect } from 'vitest';
import en from '../i18n/locales/en.json';
import hi from '../i18n/locales/hi.json';
import kn from '../i18n/locales/kn.json';

function getLeafKeys(obj: Record<string, unknown>, prefix = ''): { key: string; value: unknown }[] {
  const result: { key: string; value: unknown }[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      result.push(...getLeafKeys(v as Record<string, unknown>, fullPath));
    } else {
      result.push({ key: fullPath, value: v });
    }
  }
  return result;
}

describe('i18n Locales Parity & Completeness', () => {
  const enLeaves = getLeafKeys(en);
  const hiLeaves = getLeafKeys(hi);
  const knLeaves = getLeafKeys(kn);

  const enKeySet = new Set(enLeaves.map(l => l.key));
  const hiKeySet = new Set(hiLeaves.map(l => l.key));
  const knKeySet = new Set(knLeaves.map(l => l.key));

  it('en.json, hi.json, and kn.json have identical translation keys', () => {
    // Assert Hindi has all English keys
    for (const key of enKeySet) {
      expect(hiKeySet.has(key), `Missing key in hi.json: ${key}`).toBe(true);
    }
    // Assert Kannada has all English keys
    for (const key of enKeySet) {
      expect(knKeySet.has(key), `Missing key in kn.json: ${key}`).toBe(true);
    }

    // Assert no extra orphan keys in Hindi or Kannada
    expect(hiKeySet.size).toBe(enKeySet.size);
    expect(knKeySet.size).toBe(enKeySet.size);
  });

  it('no translation value is an empty string or whitespace only', () => {
    for (const { key, value } of enLeaves) {
      expect(typeof value, `en.json ${key} must be string`).toBe('string');
      expect((value as string).trim().length, `en.json ${key} must not be empty`).toBeGreaterThan(0);
    }

    for (const { key, value } of hiLeaves) {
      expect(typeof value, `hi.json ${key} must be string`).toBe('string');
      expect((value as string).trim().length, `hi.json ${key} must not be empty`).toBeGreaterThan(0);
    }

    for (const { key, value } of knLeaves) {
      expect(typeof value, `kn.json ${key} must be string`).toBe('string');
      expect((value as string).trim().length, `kn.json ${key} must not be empty`).toBeGreaterThan(0);
    }
  });
});
