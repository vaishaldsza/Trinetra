import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import {
  EmergencyContact,
  HikingSession,
  Incident,
  Profile,
  HikingSessionStatus,
  IncidentPriority,
  IncidentStatus,
  IncidentType,
  DetectionSource
} from '@trinetra/shared';

export interface SyncQueueItem {
  id: string;
  table_name: 'profiles' | 'emergency_contacts' | 'hiking_sessions' | 'incidents';
  action: 'insert' | 'update' | 'delete';
  record_id: string;
  payload_json: string;
  status: 'pending' | 'processing' | 'synced' | 'failed';
  attempts: number;
  created_at: string;
  updated_at: string;
}

// In-memory fallback for web environment
class MemoryStore {
  profiles = new Map<string, Profile>();
  contacts = new Map<string, EmergencyContact>();
  sessions = new Map<string, HikingSession>();
  incidents = new Map<string, Incident>();
  syncQueue: SyncQueueItem[] = [];
}

const memoryStore = new MemoryStore();
let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase | null> {
  if (Platform.OS === 'web') {
    return null;
  }
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('trinetra_offline.db');
    await initTables(dbInstance);
  }
  return dbInstance;
}

async function initTables(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS local_profiles (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_emergency_contacts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      relationship TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_hiking_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      start_location TEXT,
      end_location TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_incidents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT,
      incident_type TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      last_known_location_at TEXT,
      priority TEXT NOT NULL DEFAULT 'high',
      status TEXT NOT NULL DEFAULT 'detected',
      detection_source TEXT NOT NULL DEFAULT 'manual',
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      action TEXT NOT NULL,
      record_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

// ==================== PROFILE OPERATIONS ====================
export async function saveLocalProfile(profile: Profile): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.runAsync(
      `INSERT INTO local_profiles (id, full_name, email, phone, avatar_url, role, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         full_name = excluded.full_name,
         email = excluded.email,
         phone = excluded.phone,
         avatar_url = excluded.avatar_url,
         role = excluded.role,
         updated_at = excluded.updated_at;`,
      [
        profile.id,
        profile.full_name,
        profile.email,
        profile.phone || null,
        profile.avatar_url || null,
        profile.role,
        profile.updated_at || new Date().toISOString()
      ]
    );
  } else {
    memoryStore.profiles.set(profile.id, profile);
  }
}

export async function getLocalProfile(id: string): Promise<Profile | null> {
  const db = await getDb();
  if (db) {
    const row = await db.getFirstAsync<Profile>(
      `SELECT * FROM local_profiles WHERE id = ?;`,
      [id]
    );
    return row || null;
  }
  return memoryStore.profiles.get(id) || null;
}

// ==================== EMERGENCY CONTACTS ====================
export async function getLocalContacts(userId: string): Promise<EmergencyContact[]> {
  const db = await getDb();
  if (db) {
    const rows = await db.getAllAsync<EmergencyContact>(
      `SELECT * FROM local_emergency_contacts WHERE user_id = ? ORDER BY priority ASC;`,
      [userId]
    );
    return rows;
  }
  return Array.from(memoryStore.contacts.values()).filter(c => c.user_id === userId);
}

export async function saveLocalContact(contact: EmergencyContact): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.runAsync(
      `INSERT INTO local_emergency_contacts (id, user_id, contact_name, phone_number, relationship, priority, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         contact_name = excluded.contact_name,
         phone_number = excluded.phone_number,
         relationship = excluded.relationship,
         priority = excluded.priority;`,
      [
        contact.id,
        contact.user_id,
        contact.contact_name,
        contact.phone_number,
        contact.relationship,
        contact.priority,
        contact.created_at || new Date().toISOString()
      ]
    );
  } else {
    memoryStore.contacts.set(contact.id, contact);
  }
}

export async function deleteLocalContact(id: string): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.runAsync(`DELETE FROM local_emergency_contacts WHERE id = ?;`, [id]);
  } else {
    memoryStore.contacts.delete(id);
  }
}

// ==================== HIKING SESSIONS ====================
export async function saveLocalSession(session: HikingSession): Promise<void> {
  const db = await getDb();
  const startLoc = session.start_location ? JSON.stringify(session.start_location) : null;
  const endLoc = session.end_location ? JSON.stringify(session.end_location) : null;

  if (db) {
    await db.runAsync(
      `INSERT INTO local_hiking_sessions (id, user_id, start_time, end_time, start_location, end_location, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         end_time = excluded.end_time,
         end_location = excluded.end_location,
         status = excluded.status;`,
      [
        session.id,
        session.user_id,
        session.start_time,
        session.end_time || null,
        startLoc,
        endLoc,
        session.status,
        session.created_at || new Date().toISOString()
      ]
    );
  } else {
    memoryStore.sessions.set(session.id, session);
  }
}

export async function getLocalSessions(userId: string): Promise<HikingSession[]> {
  const db = await getDb();
  if (db) {
    interface DbSessionRow {
      id: string;
      user_id: string;
      start_time: string;
      end_time: string | null;
      start_location: string | null;
      end_location: string | null;
      status: HikingSessionStatus;
      created_at: string;
    }
    const rows = await db.getAllAsync<DbSessionRow>(
      `SELECT * FROM local_hiking_sessions WHERE user_id = ? ORDER BY start_time DESC;`,
      [userId]
    );
    return rows.map((r): HikingSession => ({
      id: r.id,
      user_id: r.user_id,
      start_time: r.start_time,
      end_time: r.end_time || undefined,
      start_location: r.start_location ? JSON.parse(r.start_location) : undefined,
      end_location: r.end_location ? JSON.parse(r.end_location) : undefined,
      status: r.status,
      created_at: r.created_at
    }));
  }
  return Array.from(memoryStore.sessions.values()).filter(s => s.user_id === userId);
}

// ==================== INCIDENTS (IDEMPOTENT CLIENT-GENERATED UUID) ====================
export async function saveLocalIncident(incident: Incident): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.runAsync(
      `INSERT INTO local_incidents (id, user_id, session_id, incident_type, latitude, longitude, last_known_location_at, priority, status, detection_source, is_demo, created_at, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         status = excluded.status,
         priority = excluded.priority,
         synced_at = excluded.synced_at;`,
      [
        incident.id,
        incident.user_id,
        incident.session_id || null,
        incident.incident_type,
        incident.latitude || null,
        incident.longitude || null,
        incident.last_known_location_at || null,
        incident.priority,
        incident.status,
        incident.detection_source,
        incident.is_demo ? 1 : 0,
        incident.created_at,
        incident.synced_at || null
      ]
    );
  } else {
    memoryStore.incidents.set(incident.id, incident);
  }
}

export async function getLocalIncidents(userId: string): Promise<Incident[]> {
  const db = await getDb();
  if (db) {
    interface DbIncidentRow {
      id: string;
      user_id: string;
      session_id: string | null;
      incident_type: IncidentType;
      latitude: number | null;
      longitude: number | null;
      last_known_location_at: string | null;
      priority: IncidentPriority;
      status: IncidentStatus;
      detection_source: DetectionSource;
      is_demo: number;
      created_at: string;
      synced_at: string | null;
    }
    const rows = await db.getAllAsync<DbIncidentRow>(
      `SELECT * FROM local_incidents WHERE user_id = ? ORDER BY created_at DESC;`,
      [userId]
    );
    return rows.map((r): Incident => ({
      id: r.id,
      user_id: r.user_id,
      session_id: r.session_id || undefined,
      incident_type: r.incident_type,
      latitude: r.latitude ?? undefined,
      longitude: r.longitude ?? undefined,
      last_known_location_at: r.last_known_location_at || undefined,
      priority: r.priority,
      status: r.status,
      detection_source: r.detection_source,
      is_demo: Boolean(r.is_demo),
      created_at: r.created_at,
      synced_at: r.synced_at || undefined
    }));
  }
  return Array.from(memoryStore.incidents.values()).filter(i => i.user_id === userId);
}

// ==================== SYNC QUEUE OPERATIONS ====================
export async function enqueueSync(
  id: string,
  table: SyncQueueItem['table_name'],
  action: SyncQueueItem['action'],
  recordId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const now = new Date().toISOString();
  const db = await getDb();
  const payloadJson = JSON.stringify(payload);

  if (db) {
    await db.runAsync(
      `INSERT INTO sync_queue (id, table_name, action, record_id, payload_json, status, attempts, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, ?);`,
      [id, table, action, recordId, payloadJson, now, now]
    );
  } else {
    memoryStore.syncQueue.push({
      id,
      table_name: table,
      action,
      record_id: recordId,
      payload_json: payloadJson,
      status: 'pending',
      attempts: 0,
      created_at: now,
      updated_at: now
    });
  }
}

export async function getPendingSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDb();
  if (db) {
    const rows = await db.getAllAsync<SyncQueueItem>(
      `SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at ASC;`
    );
    return rows;
  }
  return memoryStore.syncQueue.filter(q => q.status === 'pending');
}

export async function markSyncQueueItem(id: string, status: 'synced' | 'failed'): Promise<void> {
  const now = new Date().toISOString();
  const db = await getDb();
  if (db) {
    await db.runAsync(
      `UPDATE sync_queue SET status = ?, attempts = attempts + 1, updated_at = ? WHERE id = ?;`,
      [status, now, id]
    );
  } else {
    const item = memoryStore.syncQueue.find(q => q.id === id);
    if (item) {
      item.status = status;
      item.attempts += 1;
      item.updated_at = now;
    }
  }
}

export async function getPendingCount(): Promise<number> {
  const db = await getDb();
  if (db) {
    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT count(*) as count FROM sync_queue WHERE status = 'pending';`
    );
    return row?.count || 0;
  }
  return memoryStore.syncQueue.filter(q => q.status === 'pending').length;
}
