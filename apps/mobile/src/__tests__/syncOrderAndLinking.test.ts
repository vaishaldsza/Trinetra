import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('expo-sqlite', () => ({
  openDatabaseAsync: vi.fn().mockResolvedValue(null)
}));

// Mock supabase
vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    })
  }
}));

// Mock expo-crypto
vi.mock('expo-crypto', () => ({
  randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substring(2, 9)
}));

import {
  enqueueSync,
  getPendingSyncQueue,
  updateSyncItemResult,
  saveLocalVital,
  linkUnlinkedVitalsToIncident,
  getParentSyncStatus,
  getFailedSyncItems
} from '../lib/db';
import { processSyncQueue } from '../lib/sync';
import { supabase } from '../lib/supabase';

describe('Sync Order, Parent Dependency Checking & Vital Linking', () => {
  it('marks child as "blocked: parent failed" when parent mutation has failed', async () => {
    const parentSessionId = 'sess-failed-123';
    const childLocationId = 'loc-child-456';

    // 1. Enqueue parent session that previously failed
    await enqueueSync('parent-sync-item', 'hiking_sessions', 'insert', parentSessionId, {
      id: parentSessionId,
      user_id: 'user-1',
      start_time: new Date().toISOString(),
      status: 'active'
    });
    await updateSyncItemResult('parent-sync-item', 'failed', true, 'Network timeout');

    // 2. Enqueue child location point that depends on parentSessionId
    await enqueueSync('child-sync-item', 'location_history', 'insert', childLocationId, {
      id: childLocationId,
      session_id: parentSessionId,
      latitude: 32.1,
      longitude: 77.2,
      recorded_at: new Date().toISOString()
    });

    // 3. Run sync queue processor
    await processSyncQueue();

    // 4. Assert child is marked failed with clear error message
    const failedItems = await getFailedSyncItems();
    const childFailure = failedItems.find(f => f.id === 'child-sync-item');
    expect(childFailure).toBeDefined();
    expect(childFailure?.error_message).toBe('blocked: parent failed');
  });

  it('allows child to sync if parent was synced in an earlier run', async () => {
    const parentIncidentId = 'inc-synced-789';
    const childTriageId = 'triage-child-101';

    // Parent incident was marked synced in earlier run
    await enqueueSync('parent-inc-sync', 'incidents', 'insert', parentIncidentId, {
      id: parentIncidentId,
      user_id: 'user-1',
      incident_type: 'manual_sos',
      priority: 'high',
      status: 'emergency_initiated',
      detection_source: 'manual',
      created_at: new Date().toISOString()
    });
    await updateSyncItemResult('parent-inc-sync', 'synced', false);

    // Enqueue child triage assessment
    await enqueueSync('child-triage-sync', 'triage_assessments', 'insert', childTriageId, {
      id: childTriageId,
      incident_id: parentIncidentId,
      consciousness_status: 'Fully conscious',
      breathing_difficulty: false,
      bleeding_status: 'None',
      injury_location: 'Arm',
      mobility_status: 'Full mobility',
      pain_level: 2,
      assessment_summary: 'All clear',
      created_at: new Date().toISOString()
    });

    const result = await processSyncQueue();
    expect(result.syncedThisRun).toBeGreaterThanOrEqual(1);

    const parentState = await getParentSyncStatus('incidents', parentIncidentId);
    expect(parentState).toBe('synced');
  });

  it('links unlinked vital readings from the same session to a newly created incident and queues them for sync', async () => {
    const sessionId = 'session-ridge-walk';
    const incidentId = 'incident-fall-detected-999';

    // 1. Record an unlinked vital reading taken during the hike before any emergency
    const unlinkedVital = {
      id: 'vital-reading-early-pulse',
      incident_id: '00000000-0000-0000-0000-000000000000',
      session_id: sessionId,
      heart_rate_estimate: 88,
      signal_quality: 0.95,
      measurement_duration: 30,
      recorded_at: new Date().toISOString()
    };
    await saveLocalVital(unlinkedVital);

    // 2. Incident occurs! Link unlinked vitals from that session to the new incident
    const countLinked = await linkUnlinkedVitalsToIncident(sessionId, incidentId);
    expect(countLinked).toBe(1);

    // 3. Verify newly queued vital reading has incident_id assigned
    const pendingQueue = await getPendingSyncQueue();
    const queuedVital = pendingQueue.find(q => q.record_id === unlinkedVital.id);
    expect(queuedVital).toBeDefined();

    const payload = JSON.parse(queuedVital!.payload_json);
    expect(payload.incident_id).toBe(incidentId);
  });
});
