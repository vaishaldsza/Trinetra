export const APP_NAME = 'TRINETRA';
export const APP_TAGLINE = 'See the Danger. Sense the Risk. Save a Life.';

export const DEMO_BANNER_LABEL = 'DEMO MODE';
export const DEMO_SIMULATION_NOTICE = 'DEMO: All simulated data, agent activity, and alerts are marked for demonstration purposes.';

export const HEALTH_DISCLAIMER = 'NON-DIAGNOSTIC: Estimated vitals and heart-rate values are for research and reference only. Not intended for medical diagnosis or clinical use.';

export const FALL_DETECTION_DEFAULTS = {
  FREE_FALL_THRESHOLD: 0.5, // g
  IMPACT_THRESHOLD: 2.8,    // g
  INACTIVITY_THRESHOLD: 0.1, // variation
  COUNTDOWN_SECONDS: 30
};

export const SYNC_CONFIG = {
  MAX_BATCH_SIZE: 50,
  RETRY_INTERVAL_MS: 10000,
  MAX_RETRIES: 5
};

export const SUPABASE_TABLE_COLUMNS = {
  profiles: [
    'id',
    'full_name',
    'email',
    'phone',
    'avatar_url',
    'role',
    'created_at',
    'updated_at'
  ],
  emergency_contacts: [
    'id',
    'user_id',
    'contact_name',
    'phone_number',
    'relationship',
    'priority',
    'consent',
    'created_at'
  ],
  hiking_sessions: [
    'id',
    'user_id',
    'start_time',
    'end_time',
    'start_location',
    'end_location',
    'status',
    'created_at'
  ],
  incidents: [
    'id',
    'user_id',
    'session_id',
    'incident_type',
    'latitude',
    'longitude',
    'last_known_location_at',
    'priority',
    'status',
    'detection_source',
    'is_demo',
    'created_at',
    'synced_at'
  ],
  triage_assessments: [
    'id',
    'incident_id',
    'consciousness_status',
    'breathing_difficulty',
    'bleeding_status',
    'injury_location',
    'mobility_status',
    'pain_level',
    'assessment_summary',
    'created_at'
  ],
  vital_readings: [
    'id',
    'incident_id',
    'heart_rate_estimate',
    'signal_quality',
    'measurement_duration',
    'recorded_at'
  ],
  location_history: [
    'id',
    'session_id',
    'latitude',
    'longitude',
    'accuracy',
    'recorded_at'
  ]
} as const;

export type SyncTableName = keyof typeof SUPABASE_TABLE_COLUMNS;

/**
 * Strips any local-only or unexpected keys from a mutation payload so it strictly
 * conforms to the destination table columns in Supabase Postgres.
 */
export function sanitizeSyncPayload(
  table: string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  const allowed = (SUPABASE_TABLE_COLUMNS as Record<string, readonly string[]>)[table];
  if (!allowed) return { ...payload };

  const sanitized: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in payload && payload[key] !== undefined) {
      sanitized[key] = payload[key];
    }
  }
  return sanitized;
}
