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
