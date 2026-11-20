import { describe, it, expect } from 'vitest';
import { MockDataProvider } from '../lib/dataProvider/MockDataProvider';
import { DEMO_SCENARIOS } from '@trinetra/shared';

describe('Web Demo Mode & Mock Provider Hardening', () => {
  it('resetDemoData in MockDataProvider purges only is_demo rows and preserves non-demo rows', async () => {
    const provider = new MockDataProvider();

    // 1. Initially seeded incidents are demo
    const initialIncidents = await provider.getIncidents({ demoOnly: 'ALL' });
    expect(initialIncidents.length).toBeGreaterThan(0);
    expect(initialIncidents.every(i => i.is_demo)).toBe(true);

    // 2. Add a non-demo incident to the provider
    (provider as any).incidents.push({
      id: 'inc-production-001',
      user_id: 'u-prod',
      incident_type: 'manual_sos',
      priority: 'high',
      status: 'acknowledged',
      detection_source: 'manual',
      is_demo: false,
      created_at: new Date().toISOString()
    });

    // 3. Reset demo data
    const result = await provider.resetDemoData();
    expect(result.deletedCount).toBe(initialIncidents.length);

    // 4. Assert that only non-demo incidents remain
    const remaining = await provider.getIncidents({ demoOnly: 'ALL' });
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe('inc-production-001');
    expect(remaining[0].is_demo).toBe(false);
  });

  it('all four canonical demo scenarios exist with full step narrations and simulated actions', () => {
    expect(DEMO_SCENARIOS.length).toBe(4);
    const expectedIds = ['hiking_fall', 'critical_emergency', 'remote_trail', 'rescue_coordination'];
    expect(DEMO_SCENARIOS.map(s => s.id)).toEqual(expectedIds);

    for (const scenario of DEMO_SCENARIOS) {
      expect(scenario.steps.length).toBeGreaterThanOrEqual(4);
      for (const step of scenario.steps) {
        expect(step.title).toBeTruthy();
        expect(step.narration).toBeTruthy();
        expect(step.simulatedAction).toBeTruthy();
      }
    }
  });
});
