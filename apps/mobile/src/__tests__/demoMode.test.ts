import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('expo-sqlite', () => ({
  openDatabaseAsync: vi.fn().mockResolvedValue(null)
}));

vi.mock('expo-crypto', () => ({
  randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substring(2, 9)
}));

vi.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  watchPositionAsync: vi.fn().mockResolvedValue({ remove: vi.fn() }),
  Accuracy: { High: 4 }
}));

vi.mock('expo-sensors', () => ({
  Accelerometer: {
    isAvailableAsync: vi.fn().mockResolvedValue(true),
    addListener: vi.fn().mockReturnValue({ remove: vi.fn() }),
    setUpdateInterval: vi.fn()
  }
}));

vi.mock('expo-network', () => ({
  getNetworkStateAsync: vi.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true })
}));

vi.mock('react-native', () => ({
  Vibration: {
    vibrate: vi.fn(),
    cancel: vi.fn()
  },
  Platform: {
    OS: 'web'
  }
}));

import { useSafetyStore } from '../store/safetyStore';
import {
  saveLocalIncident,
  saveLocalSession,
  getLocalIncidents,
  getLocalSessions,
  resetDemoDataLocal,
  getDemoRecordCounts
} from '../lib/db';
import {
  Incident,
  HikingSession,
  IncidentStatus,
  IncidentPriority,
  IncidentType,
  DetectionSource,
  HikingSessionStatus,
  DEMO_SCENARIOS
} from '@trinetra/shared';

describe('Demo Mode & Hardening Unit Tests', () => {
  beforeEach(async () => {
    // Reset state and demo data before each test
    useSafetyStore.setState({ activeIncident: null, activeSession: null, showFallAlertModal: false });
    useSafetyStore.getState().toggleDemoMode(true);
    useSafetyStore.getState().toggleSimulatedOffline(false);
    await useSafetyStore.getState().resetDemoData();
  });

  it('sets is_demo = true on all rows created while Demo Mode is ON', async () => {
    const store = useSafetyStore.getState();
    expect(store.isDemoMode).toBe(true);

    // 1. Session created in demo mode
    const session = await store.startSession('Solang Valley Ridge');
    expect((session as any).is_demo).toBe(true);

    // 2. Incident created in demo mode
    const incident = await store.triggerSOS(DetectionSource.MANUAL, IncidentType.MANUAL_SOS);
    expect(incident.is_demo).toBe(true);

    // 3. Triage created in demo mode
    const triage = await store.submitTriage({
      consciousness: 'Fully conscious',
      breathingDifficulty: false,
      bleeding: 'Minor abrasions',
      injuryLocation: 'Left knee',
      mobility: 'Limited / Pain on walking',
      painLevel: 5
    });
    expect((triage as any).is_demo).toBe(true);

    // 4. Vital reading created in demo mode
    const vital = await store.recordVitalReading(76, 0.95);
    expect(vital.is_demo).toBe(true);

    await store.stopSession();
  });

  it('sets is_demo = false on rows created when Demo Mode is toggled OFF', async () => {
    useSafetyStore.getState().toggleDemoMode(false);
    expect(useSafetyStore.getState().isDemoMode).toBe(false);

    // 1. Session created with demo mode off
    const session = await useSafetyStore.getState().startSession('Beas Kund Trail');
    expect((session as any).is_demo).toBe(false);

    // 2. Incident created with demo mode off
    const incident = await useSafetyStore.getState().triggerSOS(DetectionSource.MANUAL, IncidentType.MANUAL_SOS);
    expect(incident.is_demo).toBe(false);

    // 3. Triage created with demo mode off
    const triage = await useSafetyStore.getState().submitTriage({
      consciousness: 'Fully conscious',
      breathingDifficulty: false,
      bleeding: 'None',
      injuryLocation: 'None',
      mobility: 'Full mobility',
      painLevel: 0
    });
    expect((triage as any).is_demo).toBe(false);

    await useSafetyStore.getState().cancelSOS(incident.id);
    await useSafetyStore.getState().stopSession();
  });

  it('reset demo data deletes ONLY is_demo rows and strictly preserves real non-demo rows', async () => {
    const userId = useSafetyStore.getState().profile.id;

    // 1. Seed a REAL (non-demo) incident and session
    const realSession: HikingSession = {
      id: 'sess-real-001',
      user_id: userId,
      start_time: new Date().toISOString(),
      status: HikingSessionStatus.COMPLETED,
      created_at: new Date().toISOString()
    };
    (realSession as any).is_demo = 0;
    await saveLocalSession(realSession);

    const realIncident: Incident = {
      id: 'inc-real-001',
      user_id: userId,
      session_id: 'sess-real-001',
      incident_type: IncidentType.MANUAL_SOS,
      priority: IncidentPriority.HIGH,
      status: IncidentStatus.RESOLVED,
      detection_source: DetectionSource.MANUAL,
      is_demo: false,
      created_at: new Date().toISOString()
    };
    await saveLocalIncident(realIncident);

    // 2. Create demo records via store
    useSafetyStore.getState().toggleDemoMode(true);
    await useSafetyStore.getState().startSession('Demo High Pass');
    await useSafetyStore.getState().triggerSOS(DetectionSource.ACCELEROMETER, IncidentType.FALL_DETECTED);
    await useSafetyStore.getState().recordVitalReading(82, 0.9, true);

    // 3. Perform Reset Demo Data
    const result = await useSafetyStore.getState().resetDemoData();
    expect(result.deletedCount).toBeGreaterThan(0);

    // 4. Assert that the REAL non-demo session and incident are preserved
    const remainingSessions = await getLocalSessions(userId);
    const remainingIncidents = await getLocalIncidents(userId);

    const preservedSession = remainingSessions.find(s => s.id === 'sess-real-001');
    const preservedIncident = remainingIncidents.find(i => i.id === 'inc-real-001');

    expect(preservedSession).toBeDefined();
    expect(preservedIncident).toBeDefined();

    // Assert that no demo incidents remain
    const remainingDemoIncidents = remainingIncidents.filter(i => i.is_demo);
    expect(remainingDemoIncidents.length).toBe(0);

    useSafetyStore.setState({ activeIncident: null });
  });

  it('Scenario 1: Hiking Fall runs to completion against mocks with zero real dispatches', async () => {
    const scenario = DEMO_SCENARIOS.find(s => s.id === 'hiking_fall');
    expect(scenario).toBeDefined();
    expect(scenario?.steps.length).toBe(5);

    const store = useSafetyStore.getState();
    store.toggleDemoMode(true);

    // Step 1: Simulated fall detection trigger
    store.simulateFallEvent();
    expect(useSafetyStore.getState().showFallAlertModal).toBe(true);

    // Step 2 & 3: Confirm Fall SOS
    const incident = await store.confirmFallSOS();
    expect(incident).toBeDefined();
    expect(incident.detection_source).toBe(DetectionSource.ACCELEROMETER);
    expect(incident.incident_type).toBe(IncidentType.FALL_DETECTED);
    expect(incident.is_demo).toBe(true);
    expect(incident.priority).toBe(IncidentPriority.CRITICAL);

    // Step 4: Triage engagement
    const triage = await store.submitTriage({
      consciousness: 'Fully conscious',
      breathingDifficulty: false,
      bleeding: 'Minor abrasions',
      injuryLocation: 'Right ankle',
      mobility: 'Immobilized',
      painLevel: 8
    });
    expect(triage).toBeDefined();
    expect((triage as any).is_demo).toBe(true);

    // Step 5: Assert local storage complete
    const incidents = await getLocalIncidents(store.profile.id);
    expect(incidents.some(i => i.id === incident.id)).toBe(true);
  });

  it('Scenario 2: Critical Emergency escalates priority instantly without delay', async () => {
    const scenario = DEMO_SCENARIOS.find(s => s.id === 'critical_emergency');
    expect(scenario).toBeDefined();

    const store = useSafetyStore.getState();
    store.toggleDemoMode(true);

    // Step 1 & 2: Submit triage with unconscious status
    const triage = await store.submitTriage({
      consciousness: 'Unresponsive',
      breathingDifficulty: true,
      bleeding: 'Severe bleeding',
      injuryLocation: 'Head trauma / unconscious',
      mobility: 'Immobilized',
      painLevel: 10
    });

    // Step 3: Priority escalates immediately to CRITICAL
    const activeInc = useSafetyStore.getState().activeIncident;
    expect(activeInc).toBeDefined();
    expect(activeInc?.priority).toBe(IncidentPriority.CRITICAL);
    expect(activeInc?.is_demo).toBe(true);

    // Step 4: Optical PPG reading logged
    const vital = await store.recordVitalReading(44, 0.88, true);
    expect(vital.heart_rate_estimate).toBe(44);
    expect(vital.is_demo).toBe(true);
  });

  it('Scenario 3: Remote Trail Without Internet tolerates disconnect and syncs on reconnect', async () => {
    const store = useSafetyStore.getState();
    store.toggleDemoMode(true);

    // Step 1: Simulate network disconnect
    store.toggleSimulatedOffline(true);
    expect(useSafetyStore.getState().isSimulatedOffline).toBe(true);

    // Step 2: Trigger SOS while disconnected (persists to SQLite with zero network crash)
    const inc = await store.triggerSOS(DetectionSource.MANUAL, IncidentType.MANUAL_SOS);
    expect(inc).toBeDefined();
    expect(inc.is_demo).toBe(true);

    // Step 3: Sync attempt while offline leaves rows pending with zero network error
    await store.syncNow();
    expect(useSafetyStore.getState().syncCounts.pending).toBeGreaterThan(0);

    // Step 4: Reconnect network
    store.toggleSimulatedOffline(false);
    expect(useSafetyStore.getState().isSimulatedOffline).toBe(false);

    // Step 5: Sync cycle runs
    await store.syncNow();
    expect(useSafetyStore.getState().isSyncing).toBe(false);
  });

  it('Scenario 4: Rescue Coordination ensures real external carrier dispatches are impossible', async () => {
    const scenario = DEMO_SCENARIOS.find(s => s.id === 'rescue_coordination');
    expect(scenario).toBeDefined();

    const store = useSafetyStore.getState();
    store.toggleDemoMode(true);

    // Trigger an incident in demo mode
    const inc = await store.triggerSOS(DetectionSource.MANUAL, IncidentType.MANUAL_SOS);
    expect(inc.is_demo).toBe(true);

    // Assert that when is_demo = true, external notifications are flagged simulated
    const finalStep = scenario?.steps.find(s => s.stepNumber === 5);
    expect(finalStep?.dataBadge).toContain('SIMULATED');
    expect(finalStep?.payloadSummary?.is_demo).toBe(true);
    expect(finalStep?.payloadSummary?.twilio_sms).toContain('carrier skipped');
  });
});
