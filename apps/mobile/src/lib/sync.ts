import { supabase, isSupabaseConfigured } from './supabase';
import {
  getPendingSyncQueue,
  markSyncQueueItem,
  getPendingCount,
  saveLocalIncident,
  getLocalIncidents
} from './db';

export interface SyncResult {
  synced: number;
  failed: number;
  remaining: number;
  error?: string;
}

export async function processSyncQueue(): Promise<SyncResult> {
  if (!isSupabaseConfigured) {
    const remaining = await getPendingCount();
    return { synced: 0, failed: 0, remaining, error: 'Supabase not configured' };
  }

  const queue = await getPendingSyncQueue();
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
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

      await markSyncQueueItem(item.id, 'synced');
      synced++;
    } catch {
      await markSyncQueueItem(item.id, 'failed');
      failed++;
    }
  }

  const remaining = await getPendingCount();
  return { synced, failed, remaining };
}
