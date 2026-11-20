// TRINETRA Edge Function Contracts
// Standalone definitions to prevent edge functions from importing @trinetra/shared monorepo packages.
// Verified by unit tests to ensure parity with packages/shared/src/enums.ts.

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  FIRST_RESPONDER = 'first_responder'
}

export enum HikingSessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  EMERGENCY_ACTIVE = 'emergency_active'
}

export enum IncidentStatus {
  DETECTED = 'detected',
  AWAITING_CONFIRMATION = 'awaiting_confirmation',
  EMERGENCY_INITIATED = 'emergency_initiated',
  ASSISTANCE_REQUESTED = 'assistance_requested',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled'
}

export enum IncidentPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum IncidentType {
  MANUAL_SOS = 'manual_sos',
  FALL_DETECTED = 'fall_detected',
  AUDIO_DISTRESS = 'audio_distress',
  INACTIVITY = 'inactivity',
  HEALTH_ANOMALY = 'health_anomaly',
  OTHER = 'other'
}

export enum DetectionSource {
  MANUAL = 'manual',
  ACCELEROMETER = 'accelerometer',
  AUDIO_YAMNET = 'audio_yamnet',
  VITAL_MONITOR = 'vital_monitor',
  SYSTEM = 'system'
}

export enum NotificationChannel {
  SMS = 'sms',
  VOICE = 'voice'
}

export enum NotificationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETRY_SCHEDULED = 'retry_scheduled'
}

export enum AgentTaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum AgentName {
  LOCATION_INTELLIGENCE = 'location_intelligence',
  MEDICAL_INTELLIGENCE = 'medical_intelligence',
  ROUTE_INTELLIGENCE = 'route_intelligence',
  EMERGENCY_COORDINATION = 'emergency_coordination',
  COMMUNICATION = 'communication'
}

export interface Profile {
  id: string;
  full_name?: string | null;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  contact_name: string;
  phone_number: string;
  relationship: string;
  priority: number;
  consent: boolean;
  created_at?: string;
}

export interface HikingSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string | null;
  start_location?: Record<string, unknown> | null;
  end_location?: Record<string, unknown> | null;
  status: HikingSessionStatus;
  created_at?: string;
}

export interface Incident {
  id: string;
  user_id: string;
  session_id?: string | null;
  incident_type: IncidentType;
  latitude?: number | null;
  longitude?: number | null;
  last_known_location_at?: string | null;
  priority: IncidentPriority;
  status: IncidentStatus;
  detection_source: DetectionSource;
  is_demo: boolean;
  created_at?: string;
  synced_at?: string | null;
}

export interface AgentTask {
  id: string;
  incident_id: string;
  agent_name: AgentName;
  task_type: string;
  status: AgentTaskStatus;
  input_data?: Record<string, unknown> | null;
  output_data?: Record<string, unknown> | null;
  is_demo: boolean;
  created_at?: string;
  completed_at?: string | null;
}

export interface Notification {
  id: string;
  incident_id: string;
  contact_id?: string | null;
  channel: NotificationChannel;
  recipient: string;
  provider_reference?: string | null;
  status: NotificationStatus;
  error_message?: string | null;
  is_demo: boolean;
  retry_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TriageAssessment {
  id: string;
  incident_id: string;
  consciousness_status: string;
  breathing_difficulty: boolean;
  bleeding_status: string;
  injury_location?: string | null;
  mobility_status: string;
  pain_level: number;
  assessment_summary?: string | null;
  created_at?: string;
}

export interface VitalReading {
  id: string;
  incident_id: string;
  heart_rate_estimate: number;
  signal_quality: number;
  measurement_duration: number;
  is_demo?: boolean;
  recorded_at: string;
}
