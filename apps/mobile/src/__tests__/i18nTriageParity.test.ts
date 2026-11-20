import { describe, it, expect } from 'vitest';
import { IncidentPriority } from '@trinetra/shared';
import { evaluateTriageRules, TriageInput } from '../lib/triageEngine';
import i18n, { changeAppLanguage } from '../i18n';

describe('Triage Rule Engine Language Independence', () => {
  const testCases: { name: string; input: TriageInput; expectedPriority: IncidentPriority }[] = [
    {
      name: 'Unresponsive hiker escalates to CRITICAL',
      input: {
        consciousness: 'Unresponsive',
        breathingDifficulty: false,
        bleeding: 'None',
        injuryLocation: 'Head trauma',
        mobility: 'Full mobility',
        painLevel: 2
      },
      expectedPriority: IncidentPriority.CRITICAL
    },
    {
      name: 'Severe bleeding escalates to CRITICAL',
      input: {
        consciousness: 'Fully conscious',
        breathingDifficulty: false,
        bleeding: 'Severe bleeding',
        injuryLocation: 'Left leg',
        mobility: 'Full mobility',
        painLevel: 5
      },
      expectedPriority: IncidentPriority.CRITICAL
    },
    {
      name: 'Breathing difficulty escalates to CRITICAL',
      input: {
        consciousness: 'Fully conscious',
        breathingDifficulty: true,
        bleeding: 'None',
        injuryLocation: 'Chest',
        mobility: 'Full mobility',
        painLevel: 4
      },
      expectedPriority: IncidentPriority.CRITICAL
    },
    {
      name: 'High pain (9/10) evaluates to HIGH',
      input: {
        consciousness: 'Fully conscious',
        breathingDifficulty: false,
        bleeding: 'Minor abrasions',
        injuryLocation: 'Right ankle',
        mobility: 'Limited / Pain on walking',
        painLevel: 9
      },
      expectedPriority: IncidentPriority.HIGH
    },
    {
      name: 'Minor abrasions with full mobility evaluates to LOW',
      input: {
        consciousness: 'Fully conscious',
        breathingDifficulty: false,
        bleeding: 'Minor abrasions',
        injuryLocation: 'Right arm',
        mobility: 'Full mobility',
        painLevel: 2
      },
      expectedPriority: IncidentPriority.LOW
    }
  ];

  it('produces identical clinical priority across all active languages (en, hi, kn)', async () => {
    const languages: ('en' | 'hi' | 'kn')[] = ['en', 'hi', 'kn'];

    for (const lang of languages) {
      await changeAppLanguage(lang);
      expect(i18n.language).toBe(lang);

      for (const tc of testCases) {
        // Evaluate rule engine while language is set to lang
        const assessment = evaluateTriageRules(tc.input);

        expect(
          assessment.priority,
          `Language '${lang}' altered rule output for '${tc.name}'`
        ).toBe(tc.expectedPriority);

        // Verify that localized display labels exist and do not impact canonical enum logic
        const localizedLabel = i18n.t(`triage.question1_title`);
        expect(localizedLabel.length).toBeGreaterThan(0);
      }
    }

    // Reset back to English
    await changeAppLanguage('en');
  });
});
