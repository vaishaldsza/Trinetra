import { describe, it, expect } from 'vitest';
import { evaluateTriageRules, TriageInput } from '../lib/triageEngine';
import { IncidentPriority } from '@trinetra/shared';

describe('Deterministic Emergency Triage Rule Engine', () => {
  it('escalates to CRITICAL when hiker is unresponsive', () => {
    const input: TriageInput = {
      consciousness: 'Unresponsive',
      breathingDifficulty: false,
      bleeding: 'None',
      injuryLocation: 'Head',
      mobility: 'Immobilized',
      painLevel: 0
    };

    const result = evaluateTriageRules(input);
    expect(result.priority).toBe(IncidentPriority.CRITICAL);
    expect(result.criticalWarningSigns).toContain('Unconsciousness / unresponsiveness');
  });

  it('escalates to CRITICAL when acute breathing difficulty is reported', () => {
    const input: TriageInput = {
      consciousness: 'Fully conscious',
      breathingDifficulty: true,
      bleeding: 'None',
      injuryLocation: 'Chest',
      mobility: 'Limited / Pain on walking',
      painLevel: 6
    };

    const result = evaluateTriageRules(input);
    expect(result.priority).toBe(IncidentPriority.CRITICAL);
    expect(result.criticalWarningSigns).toContain('Acute breathing difficulty / hypoxia risk');
  });

  it('escalates to CRITICAL when severe bleeding is reported', () => {
    const input: TriageInput = {
      consciousness: 'Fully conscious',
      breathingDifficulty: false,
      bleeding: 'Severe bleeding',
      injuryLocation: 'Thigh',
      mobility: 'Immobilized',
      painLevel: 8
    };

    const result = evaluateTriageRules(input);
    expect(result.priority).toBe(IncidentPriority.CRITICAL);
    expect(result.criticalWarningSigns).toContain('Severe hemorrhaging risk');
  });

  it('does NOT escalate to CRITICAL for non-critical conditions', () => {
    const minorInjury: TriageInput = {
      consciousness: 'Fully conscious',
      breathingDifficulty: false,
      bleeding: 'Minor abrasions',
      injuryLocation: 'Knee',
      mobility: 'Limited / Pain on walking',
      painLevel: 3
    };

    const resultMinor = evaluateTriageRules(minorInjury);
    expect(resultMinor.priority).not.toBe(IncidentPriority.CRITICAL);
    expect(resultMinor.priority).toBe(IncidentPriority.LOW);

    const moderateInjury: TriageInput = {
      consciousness: 'Fully conscious',
      breathingDifficulty: false,
      bleeding: 'Moderate',
      injuryLocation: 'Arm',
      mobility: 'Full mobility',
      painLevel: 5
    };

    const resultModerate = evaluateTriageRules(moderateInjury);
    expect(resultModerate.priority).not.toBe(IncidentPriority.CRITICAL);
    expect(resultModerate.priority).toBe(IncidentPriority.HIGH);
  });
});
