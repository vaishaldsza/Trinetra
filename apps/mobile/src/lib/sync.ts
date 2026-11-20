import { supabase, isSupabaseConfigured } from './supabase';
import {
  getPendingSyncQueue,
  updateSyncItemResult,
  getSyncStatusCounts,
  saveLocalIncident,
  getLocalIncidents,
  SyncStatusCounts
} from './db';

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

  const queue = await getPendingSyncQueue();
  let syncedThisRun = 0;
  let failedThisRun = 0;
  const now = Date.now();

  for (const item of queue) {
    // Check if max attempts reached -> mark failed
    if (item.attempts >= MAX_ATTEMPTS) {
      await updateSyncItemResult(item.id, 'failed', false);
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

    try {
      const payload = JSON.parse(item.payload_json);

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
        const incidents = await getLocalIncidents(payload.user_id);
        const match = incidents.find(i => i.id === payload.id);
        if (match) {
          match.synced_at = new Date().toISOString();
          await saveLocalIncident(match);
        }
      }

      await updateSyncItemResult(item.id, 'synced', false);
      syncedThisRun++;
    } catch {
      const newAttempts = item.attempts + 1;
      if (newAttempts >= MAX_ATTEMPTS) {
        await updateSyncItemResult(item.id, 'failed', true);
        failedThisRun++;
      } else {
        await updateSyncItemResult(item.id, 'pending', true);
      }
    }
  }

  const finalCounts = await getSyncStatusCounts();
  return { counts: finalCounts, syncedThisRun, failedThisRun };
}
