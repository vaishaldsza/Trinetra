import { describe, it, expect } from 'vitest';
import {
  SUPABASE_TABLE_COLUMNS,
  SyncTableName,
  sanitizeSyncPayload
} from '@trinetra/shared';

describe('Sync Payload Column Verification & Sanitization', () => {
  it('verifies every table payload only contains known Supabase columns after sanitization', () => {
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
        local_dirty_flag: true, // local-only key
        attempts: 2 // local-only key
      },
      emergency_contacts: {
        id: '22222222-2222-2222-2222-222222222222',
        user_id: '11111111-1111-1111-1111-111111111111',
        contact_name: 'Contact A',
        phone_number: '+919876543211',
        relationship: 'Sibling',
        priority: 1,
        created_at: new Date().toISOString(),
        sync_status: 'pending' // local-only key
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
        battery_level: 85 // local-only key
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
        is_demo: true, // valid column on incidents
        created_at: new Date().toISOString(),
        synced_at: null,
        ui_hold_duration_ms: 2000 // local-only key
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
        is_demo: true, // MUST BE STRIPPED: does not exist on Supabase triage_assessments table
        audio_transcript_raw: 'raw text' // local-only key
      },
      vital_readings: {
        id: '66666666-6666-6666-6666-666666666666',
        incident_id: '44444444-4444-4444-4444-444444444444',
        heart_rate_estimate: 74,
        signal_quality: 0.92,
        measurement_duration: 30,
        recorded_at: new Date().toISOString(),
        is_demo: true, // MUST BE STRIPPED: does not exist on Supabase vital_readings table
        optical_buffer_samples: [1, 2, 3] // local-only key
      },
      location_history: {
        id: '77777777-7777-7777-7777-777777777777',
        session_id: '33333333-3333-3333-3333-333333333333',
        latitude: 32.241,
        longitude: 77.182,
        accuracy: 4.5,
        recorded_at: new Date().toISOString(),
        gps_satellite_count: 8 // local-only key
      }
    };

    const tables = Object.keys(SUPABASE_TABLE_COLUMNS) as SyncTableName[];

    for (const table of tables) {
      const rawPayload = samplePayloads[table];
      const sanitized = sanitizeSyncPayload(table, rawPayload);
      const allowedColumns = SUPABASE_TABLE_COLUMNS[table] as readonly string[];

      // Every key in the sanitized payload must be in the known column list
      const sanitizedKeys = Object.keys(sanitized);
      for (const key of sanitizedKeys) {
        expect(
          allowedColumns.includes(key),
          `Table "${table}" contains unmapped/unknown column key: "${key}"`
        ).toBe(true);
      }
    }
  });

  it('explicitly strips is_demo from vital_readings and triage_assessments while keeping on incidents', () => {
    const vitalPayload = {
      id: '66666666-6666-6666-6666-666666666666',
      incident_id: '44444444-4444-4444-4444-444444444444',
      heart_rate_estimate: 72,
      signal_quality: 0.88,
      measurement_duration: 30,
      is_demo: true,
      recorded_at: new Date().toISOString()
    };
    const sanitizedVital = sanitizeSyncPayload('vital_readings', vitalPayload);
    expect(sanitizedVital).not.toHaveProperty('is_demo');

    const triagePayload = {
      id: '55555555-5555-5555-5555-555555555555',
      incident_id: '44444444-4444-4444-4444-444444444444',
      consciousness_status: 'Fully conscious',
      breathing_difficulty: false,
      bleeding_status: 'None',
      injury_location: 'Head',
      mobility_status: 'Full mobility',
      pain_level: 0,
      assessment_summary: 'Clean',
      is_demo: true,
      created_at: new Date().toISOString()
    };
    const sanitizedTriage = sanitizeSyncPayload('triage_assessments', triagePayload);
    expect(sanitizedTriage).not.toHaveProperty('is_demo');

    const incidentPayload = {
      id: '44444444-4444-4444-4444-444444444444',
      user_id: '11111111-1111-1111-1111-111111111111',
      incident_type: 'manual_sos',
      priority: 'critical',
      status: 'emergency_initiated',
      detection_source: 'manual',
      is_demo: true,
      created_at: new Date().toISOString()
    };
    const sanitizedIncident = sanitizeSyncPayload('incidents', incidentPayload);
    expect(sanitizedIncident).toHaveProperty('is_demo', true);
  });
});
