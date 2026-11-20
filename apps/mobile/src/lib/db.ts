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
  DetectionSource,
  LocationHistory,
  VitalReading
} from '@trinetra/shared';

export interface SyncQueueItem {
  id: string;
  table_name: 'profiles' | 'emergency_contacts' | 'hiking_sessions' | 'incidents' | 'location_history' | 'triage_assessments' | 'vital_readings';
  action: 'insert' | 'update' | 'delete';
  record_id: string;
  payload_json: string;
  status: 'pending' | 'processing' | 'synced' | 'failed';
  attempts: number;
  last_attempt_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface LocalTriageAssessment {
  id: string;
  incident_id: string;
  consciousness_status: string;
  breathing_difficulty: boolean;
  bleeding_status: string;
  injury_location: string;
  mobility_status: string;
  pain_level: number;
  assessment_summary: string;
  created_at: string;
}

export interface LocalNotificationRequest {
  id: string;
  incident_id: string;
  contact_id?: string;
  channel: 'sms' | 'voice';
  recipient: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  error_message?: string;
  created_at: string;
}

// Memory Store for Web Fallback
class MemoryStore {
  profiles = new Map<string, Profile>();
  contacts = new Map<string, EmergencyContact>();
  sessions = new Map<string, HikingSession>();
  incidents = new Map<string, Incident>();
  locations: LocationHistory[] = [];
  triage = new Map<string, LocalTriageAssessment>();
  vitals = new Map<string, VitalReading>();
  notifications = new Map<string, LocalNotificationRequest>();
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
    await runMigrations(dbInstance);
  }
  return dbInstance;
}

// Ordered migrations using schema_version table
async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ current_version: number }>(
    `SELECT MAX(version) as current_version FROM schema_version;`
  );
  const currentVersion = row?.current_version || 0;

  // Migration 1: Base Tables
  if (currentVersion < 1) {
    await db.execAsync(`
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
        last_attempt_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      INSERT INTO schema_version (version, applied_at) VALUES (1, datetime('now'));
    `);
  }

  // Migration 2: Location history, triage assessments, notification requests
  if (currentVersion < 2) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS local_location_history (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        accuracy REAL,
        recorded_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS local_triage_assessments (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        consciousness_status TEXT NOT NULL,
        breathing_difficulty INTEGER NOT NULL DEFAULT 0,
        bleeding_status TEXT NOT NULL,
        injury_location TEXT NOT NULL,
        mobility_status TEXT NOT NULL,
        pain_level INTEGER NOT NULL DEFAULT 0,
        assessment_summary TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS local_notification_requests (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        contact_id TEXT,
        channel TEXT NOT NULL,
        recipient TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        error_message TEXT,
        created_at TEXT NOT NULL
      );

      INSERT INTO schema_version (version, applied_at) VALUES (2, datetime('now'));
    `);
  }

  // Migration 3: Vital readings (labeled non-diagnostic, carries is_demo)
  if (currentVersion < 3) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS local_vital_readings (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        heart_rate_estimate REAL NOT NULL,
        signal_quality REAL NOT NULL DEFAULT 1.0,
        measurement_duration REAL NOT NULL DEFAULT 30.0,
        is_demo INTEGER NOT NULL DEFAULT 1,
        recorded_at TEXT NOT NULL
      );

      INSERT INTO schema_version (version, applied_at) VALUES (3, datetime('now'));
    `);
  }

  // Migration 4: Add error_message column to sync_queue
  if (currentVersion < 4) {
    try {
      await db.execAsync(`ALTER TABLE sync_queue ADD COLUMN error_message TEXT;`);
    } catch {
      // Column may exist on fresh installs
    }
    await db.execAsync(`INSERT INTO schema_version (version, applied_at) VALUES (4, datetime('now'));`);
  }
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

// ==================== INCIDENTS ====================
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

// ==================== LOCATION HISTORY ====================
export async function saveLocalLocationPoint(point: LocationHistory): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.runAsync(
      `INSERT INTO local_location_history (id, session_id, latitude, longitude, accuracy, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [point.id, point.session_id, point.latitude, point.longitude, point.accuracy || null, point.recorded_at]
    );
  } else {
    memoryStore.locations.push(point);
  }
}

// ==================== TRIAGE & NOTIFICATIONS ====================
export async function saveLocalTriage(triage: LocalTriageAssessment): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.runAsync(
      `INSERT INTO local_triage_assessments (id, incident_id, consciousness_status, breathing_difficulty, bleeding_status, injury_location, mobility_status, pain_level, assessment_summary, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        triage.id,
        triage.incident_id,
        triage.consciousness_status,
        triage.breathing_difficulty ? 1 : 0,
        triage.bleeding_status,
        triage.injury_location,
        triage.mobility_status,
        triage.pain_level,
        triage.assessment_summary,
        triage.created_at
      ]
    );
  } else {
    memoryStore.triage.set(triage.id, triage);
  }
}

export async function saveLocalVital(vital: VitalReading): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.runAsync(
      `INSERT INTO local_vital_readings (id, incident_id, heart_rate_estimate, signal_quality, measurement_duration, is_demo, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        vital.id,
        vital.incident_id,
        vital.heart_rate_estimate,
        vital.signal_quality,
        vital.measurement_duration,
        vital.is_demo !== false ? 1 : 0,
        vital.recorded_at
      ]
    );
  } else {
    memoryStore.vitals.set(vital.id, vital);
  }
}

export async function saveLocalNotificationRequest(notif: LocalNotificationRequest): Promise<void> {
  const db = await getDb();
  if (db) {
    await db.runAsync(
      `INSERT INTO local_notification_requests (id, incident_id, contact_id, channel, recipient, status, error_message, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        notif.id,
        notif.incident_id,
        notif.contact_id || null,
        notif.channel,
        notif.recipient,
        notif.status,
        notif.error_message || null,
        notif.created_at
      ]
    );
  } else {
    memoryStore.notifications.set(notif.id, notif);
  }
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

export async function updateSyncItemResult(
  id: string,
  status: 'synced' | 'pending' | 'failed',
  incrementAttempt = true,
  errorMessage?: string
): Promise<void> {
  const now = new Date().toISOString();
  const db = await getDb();
  if (db) {
    if (incrementAttempt) {
      await db.runAsync(
        `UPDATE sync_queue SET status = ?, attempts = attempts + 1, last_attempt_at = ?, error_message = ?, updated_at = ? WHERE id = ?;`,
        [status, now, errorMessage || null, now, id]
      );
    } else {
      await db.runAsync(
        `UPDATE sync_queue SET status = ?, error_message = ?, updated_at = ? WHERE id = ?;`,
        [status, errorMessage || null, now, id]
      );
    }
  } else {
    const item = memoryStore.syncQueue.find(q => q.id === id);
    if (item) {
      item.status = status;
      if (incrementAttempt) item.attempts += 1;
      item.last_attempt_at = now;
      if (errorMessage !== undefined) item.error_message = errorMessage;
      item.updated_at = now;
    }
  }
}

export async function getFailedSyncItems(): Promise<SyncQueueItem[]> {
  const db = await getDb();
  if (db) {
    return await db.getAllAsync<SyncQueueItem>(
      `SELECT * FROM sync_queue WHERE status = 'failed' ORDER BY updated_at DESC LIMIT 20;`
    );
  }
  return memoryStore.syncQueue.filter(q => q.status === 'failed');
}

export interface SyncStatusCounts {
  pending: number;
  synced: number;
  failed: number;
}

export async function getSyncStatusCounts(): Promise<SyncStatusCounts> {
  const db = await getDb();
  if (db) {
    const rows = await db.getAllAsync<{ status: string; count: number }>(
      `SELECT status, count(*) as count FROM sync_queue GROUP BY status;`
    );
    const counts: SyncStatusCounts = { pending: 0, synced: 0, failed: 0 };
    for (const r of rows) {
      if (r.status === 'pending') counts.pending = r.count;
      else if (r.status === 'synced') counts.synced = r.count;
      else if (r.status === 'failed') counts.failed = r.count;
    }
    return counts;
  }

  const counts: SyncStatusCounts = { pending: 0, synced: 0, failed: 0 };
  for (const q of memoryStore.syncQueue) {
    if (q.status === 'pending') counts.pending++;
    else if (q.status === 'synced') counts.synced++;
    else if (q.status === 'failed') counts.failed++;
  }
  return counts;
}
