import { supabase, isSupabaseConfigured } from './supabase';
import {
  getPendingSyncQueue,
  updateSyncItemResult,
  getSyncStatusCounts,
  saveLocalIncident,
  getLocalIncidents,
  SyncStatusCounts,
  SyncQueueItem
} from './db';
import { sanitizeSyncPayload } from '@trinetra/shared';

const MAX_ATTEMPTS = 8;
const MAX_BACKOFF_MS = 5 * 60 * 1000; // 5 minutes cap

export interface SyncResult {
  counts: SyncStatusCounts;
  syncedThisRun: number;
  failedThisRun: number;
  error?: string;
}

export function calculateBackoffMs(attempts: number): number {
  const delay = 1000 * Math.pow(2, attempts);
  return Math.min(delay, MAX_BACKOFF_MS);
}

// Strict foreign-key dependency sync order
const TABLE_SYNC_ORDER: Record<string, number> = {
  profiles: 1,
  emergency_contacts: 2,
  hiking_sessions: 3,
  incidents: 4,
  triage_assessments: 5,
  vital_readings: 5,
  location_history: 5
};

export async function processSyncQueue(): Promise<SyncResult> {
  const initialCounts = await getSyncStatusCounts();

  // If Supabase is not configured, leave rows pending with no errors
  if (!isSupabaseConfigured) {
    return {
      counts: initialCounts,
      syncedThisRun: 0,
      failedThisRun: 0,
      error: 'Supabase unconfigured - mutations remain queued locally in SQLite'
    };
  }

  const rawQueue = await getPendingSyncQueue();
  let syncedThisRun = 0;
  let failedThisRun = 0;
  const now = Date.now();

  // 1. Sort queue by relational dependency order:
  // profiles -> emergency_contacts -> hiking_sessions -> incidents -> children
  const queue = [...rawQueue].sort(
    (a, b) => (TABLE_SYNC_ORDER[a.table_name] ?? 99) - (TABLE_SYNC_ORDER[b.table_name] ?? 99)
  );

  const pendingRecordIds = new Set<string>(queue.map(q => q.record_id));
  const syncedRecordIds = new Set<string>();

  for (const item of queue) {
    // Check if max attempts reached -> mark failed
    if (item.attempts >= MAX_ATTEMPTS) {
      await updateSyncItemResult(item.id, 'failed', false, item.error_message || 'Maximum sync retry attempts reached (8)');
      failedThisRun++;
      continue;
    }

    // Check exponential backoff window
    if (item.last_attempt_at) {
      const lastAttemptMs = new Date(item.last_attempt_at).getTime();
      const backoffDelay = calculateBackoffMs(item.attempts);
      if (now - lastAttemptMs < backoffDelay) {
        // Backoff window active, skip this turn
        continue;
      }
    }

    const rawPayload = JSON.parse(item.payload_json);

    // 2. Foreign-Key Dependency Check:
    // A child row whose parent is not yet synced stays pending (not failed, no attempt penalty)
    if (item.table_name === 'emergency_contacts' || item.table_name === 'hiking_sessions') {
      const parentUserId = rawPayload.user_id;
      if (parentUserId && pendingRecordIds.has(parentUserId) && !syncedRecordIds.has(parentUserId)) {
        continue;
      }
    } else if (item.table_name === 'incidents') {
      const parentSessionId = rawPayload.session_id;
      if (parentSessionId && pendingRecordIds.has(parentSessionId) && !syncedRecordIds.has(parentSessionId)) {
        continue;
      }
    } else if (item.table_name === 'triage_assessments' || item.table_name === 'vital_readings') {
      const parentIncidentId = rawPayload.incident_id;
      // If vital reading has no incident, keep it local-only in SQLite
      if (item.table_name === 'vital_readings' && (!parentIncidentId || parentIncidentId.startsWith('d0000000-'))) {
        await updateSyncItemResult(item.id, 'synced', false);
        syncedThisRun++;
        continue;
      }

      if (parentIncidentId && pendingRecordIds.has(parentIncidentId) && !syncedRecordIds.has(parentIncidentId)) {
        continue;
      }
    } else if (item.table_name === 'location_history') {
      const parentSessionId = rawPayload.session_id;
      if (parentSessionId && pendingRecordIds.has(parentSessionId) && !syncedRecordIds.has(parentSessionId)) {
        continue;
      }
    }

    // 3. Sanitize payload against Supabase schema columns
    const payload = sanitizeSyncPayload(item.table_name, rawPayload);

    try {
      if (item.table_name === 'profiles') {
        const { error } = await supabase.from('profiles').upsert(payload);
        if (error) throw error;
      } else if (item.table_name === 'emergency_contacts') {
        if (item.action === 'delete') {
          const { error } = await supabase.from('emergency_contacts').delete().eq('id', item.record_id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('emergency_contacts').upsert(payload);
          if (error) throw error;
        }
      } else if (item.table_name === 'hiking_sessions') {
        const { error } = await supabase.from('hiking_sessions').upsert(payload);
        if (error) throw error;
      } else if (item.table_name === 'location_history') {
        const { error } = await supabase.from('location_history').upsert(payload);
        if (error) throw error;
      } else if (item.table_name === 'triage_assessments') {
        const { error } = await supabase.from('triage_assessments').upsert(payload);
        if (error) throw error;
      } else if (item.table_name === 'vital_readings') {
        const { error } = await supabase.from('vital_readings').upsert(payload);
        if (error) throw error;
      } else if (item.table_name === 'incidents') {
        // Idempotent upsert with client-generated UUID
        const { error } = await supabase.from('incidents').upsert(payload);
        if (error) throw error;

        // Mark local incident as synced
        const incidents = await getLocalIncidents(rawPayload.user_id);
        const match = incidents.find(i => i.id === rawPayload.id);
        if (match) {
          match.synced_at = new Date().toISOString();
          await saveLocalIncident(match);
        }
      }

      await updateSyncItemResult(item.id, 'synced', false);
      syncedRecordIds.add(item.record_id);
      pendingRecordIds.delete(item.record_id);
      syncedThisRun++;
    } catch (err: unknown) {
      const errMessage = (err as { message?: string })?.message || String(err);
      const detailedError = `[${item.table_name}:${item.record_id}] ${errMessage}`;
      const newAttempts = item.attempts + 1;

      if (newAttempts >= MAX_ATTEMPTS) {
        await updateSyncItemResult(item.id, 'failed', true, detailedError);
        failedThisRun++;
      } else {
        await updateSyncItemResult(item.id, 'pending', true, detailedError);
      }
    }
  }

  const finalCounts = await getSyncStatusCounts();
  return { counts: finalCounts, syncedThisRun, failedThisRun };
}
