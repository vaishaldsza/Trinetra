import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  SUPABASE_TABLE_COLUMNS,
  SyncTableName,
  sanitizeSyncPayload
} from '@trinetra/shared';

interface ParsedTableInfo {
  columns: string[];
  notNullNoDefault: string[];
}

/**
 * Parses all SQL migration files in supabase/migrations/
 * Extracts CREATE TABLE and ALTER TABLE ADD COLUMN declarations.
 */
function parseSqlMigrations(migrationsDir: string): Record<string, ParsedTableInfo> {
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
  const tables: Record<string, ParsedTableInfo> = {};

  for (const file of files) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    // Match CREATE TABLE [IF NOT EXISTS] [public.]<tableName> ( <body> );
    const createTableRegex = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?(\w+)\s*\(([\s\S]*?)\);/gi;
    let match: RegExpExecArray | null;

    while ((match = createTableRegex.exec(content)) !== null) {
      const tableName = match[1];
      const body = match[2];
      if (!tables[tableName]) {
        tables[tableName] = { columns: [], notNullNoDefault: [] };
      }

      const lines = body
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('--'));

      for (const line of lines) {
        const cleanLine = line.replace(/,\s*$/, '').trim();
        // Skip table-level constraints (e.g. PRIMARY KEY (a, b), CONSTRAINT ..., CHECK ...)
        if (/^(constraint|primary\s+key|check|unique)\b/i.test(cleanLine)) {
          continue;
        }

        const tokens = cleanLine.split(/\s+/);
        if (tokens.length < 2) continue;
        const colName = tokens[0];

        if (!tables[tableName].columns.includes(colName)) {
          tables[tableName].columns.push(colName);
        }

        const isPrimaryKey = /\bprimary\s+key\b/i.test(cleanLine);
        const hasNotNull = /\bnot\s+null\b/i.test(cleanLine) || isPrimaryKey;
        const hasDefault = /\bdefault\b/i.test(cleanLine);

        if (hasNotNull && !hasDefault) {
          if (!tables[tableName].notNullNoDefault.includes(colName)) {
            tables[tableName].notNullNoDefault.push(colName);
          }
        }
      }
    }

    // Match ALTER TABLE [IF EXISTS] [public.]<tableName> ADD COLUMN [IF NOT EXISTS] <colName> ...;
    const alterTableRegex = /alter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?(\w+)\s+add\s+column\s+(?:if\s+not\s+exists\s+)?(\w+)\s+([^;]+);/gi;
    let alterMatch: RegExpExecArray | null;
    while ((alterMatch = alterTableRegex.exec(content)) !== null) {
      const tableName = alterMatch[1];
      const colName = alterMatch[2];
      const colDef = alterMatch[3];
      if (tables[tableName]) {
        if (!tables[tableName].columns.includes(colName)) {
          tables[tableName].columns.push(colName);
        }
        const hasNotNull = /\bnot\s+null\b/i.test(colDef);
        const hasDefault = /\bdefault\b/i.test(colDef);
        if (hasNotNull && !hasDefault) {
          if (!tables[tableName].notNullNoDefault.includes(colName)) {
            tables[tableName].notNullNoDefault.push(colName);
          }
        }
      }
    }
  }

  return tables;
}

const samplePayloads: Record<SyncTableName, Record<string, unknown>> = {
  profiles: {
    id: '11111111-1111-1111-1111-111111111111',
    full_name: 'Test Hiker',
    email: 'hiker@test.safety',
    phone: '+919876543210',
    avatar_url: null,
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    local_dirty_flag: true,
    attempts: 2
  },
  emergency_contacts: {
    id: '22222222-2222-2222-2222-222222222222',
    user_id: '11111111-1111-1111-1111-111111111111',
    contact_name: 'Contact A',
    phone_number: '+919876543211',
    relationship: 'Sibling',
    priority: 1,
    consent: true,
    created_at: new Date().toISOString(),
    sync_status: 'pending'
  },
  hiking_sessions: {
    id: '33333333-3333-3333-3333-333333333333',
    user_id: '11111111-1111-1111-1111-111111111111',
    start_time: new Date().toISOString(),
    end_time: null,
    start_location: { trail: 'Pass Ridge' },
    end_location: null,
    status: 'active',
    created_at: new Date().toISOString(),
    battery_level: 85
  },
  incidents: {
    id: '44444444-4444-4444-4444-444444444444',
    user_id: '11111111-1111-1111-1111-111111111111',
    session_id: '33333333-3333-3333-3333-333333333333',
    incident_type: 'manual_sos',
    latitude: 32.24,
    longitude: 77.18,
    last_known_location_at: new Date().toISOString(),
    priority: 'critical',
    status: 'emergency_initiated',
    detection_source: 'manual',
    is_demo: true,
    created_at: new Date().toISOString(),
    synced_at: null,
    ui_hold_duration_ms: 2000
  },
  triage_assessments: {
    id: '55555555-5555-5555-5555-555555555555',
    incident_id: '44444444-4444-4444-4444-444444444444',
    consciousness_status: 'Fully conscious',
    breathing_difficulty: false,
    bleeding_status: 'None',
    injury_location: 'Right knee',
    mobility_status: 'Full mobility',
    pain_level: 2,
    assessment_summary: 'Normal vitals and assessment',
    created_at: new Date().toISOString(),
    is_demo: true,
    audio_transcript_raw: 'raw text'
  },
  vital_readings: {
    id: '66666666-6666-6666-6666-666666666666',
    incident_id: '44444444-4444-4444-4444-444444444444',
    heart_rate_estimate: 74,
    signal_quality: 0.92,
    measurement_duration: 30,
    recorded_at: new Date().toISOString(),
    is_demo: true,
    optical_buffer_samples: [1, 2, 3]
  },
  location_history: {
    id: '77777777-7777-7777-7777-777777777777',
    session_id: '33333333-3333-3333-3333-333333333333',
    latitude: 32.241,
    longitude: 77.182,
    accuracy: 4.5,
    recorded_at: new Date().toISOString(),
    gps_satellite_count: 8
  }
};

describe('Sync Payload Audit: Migrations SQL Parser & Column Verification', () => {
  const migrationsDir = path.resolve(__dirname, '../../../../supabase/migrations');
  const parsedTables = parseSqlMigrations(migrationsDir);
  const syncedTables = Object.keys(SUPABASE_TABLE_COLUMNS) as SyncTableName[];

  it('asserts SUPABASE_TABLE_COLUMNS matches parsed supabase/migrations/*.sql real columns for every synced table', () => {
    for (const table of syncedTables) {
      expect(parsedTables, `Table "${table}" not found in parsed migrations`).toHaveProperty(table);

      const realSqlColumns = parsedTables[table].columns.slice().sort();
      const declaredColumns = [...SUPABASE_TABLE_COLUMNS[table]].sort();

      expect(
        declaredColumns,
        `SUPABASE_TABLE_COLUMNS for "${table}" does not match real columns in supabase/migrations/*.sql`
      ).toEqual(realSqlColumns);
    }
  });

  it('asserts every NOT NULL column without a default is present in each sanitized payload (fails with table and column name)', () => {
    for (const table of syncedTables) {
      const rawPayload = samplePayloads[table];
      const sanitized = sanitizeSyncPayload(table, rawPayload);
      const requiredColumns = parsedTables[table].notNullNoDefault;

      for (const col of requiredColumns) {
        const val = sanitized[col];
        expect(
          val !== undefined && val !== null,
          `Table "${table}" is missing required NOT NULL column without default: "${col}"`
        ).toBe(true);
      }
    }
  });

  it('explicitly strips unmapped keys from payloads (e.g. is_demo from vital_readings and triage_assessments)', () => {
    const sanitizedVital = sanitizeSyncPayload('vital_readings', samplePayloads.vital_readings);
    expect(sanitizedVital).not.toHaveProperty('is_demo');
    expect(sanitizedVital).not.toHaveProperty('optical_buffer_samples');

    const sanitizedTriage = sanitizeSyncPayload('triage_assessments', samplePayloads.triage_assessments);
    expect(sanitizedTriage).not.toHaveProperty('is_demo');
    expect(sanitizedTriage).not.toHaveProperty('audio_transcript_raw');

    const sanitizedIncident = sanitizeSyncPayload('incidents', samplePayloads.incidents);
    expect(sanitizedIncident).toHaveProperty('is_demo', true);
    expect(sanitizedIncident).not.toHaveProperty('ui_hold_duration_ms');
  });
});
