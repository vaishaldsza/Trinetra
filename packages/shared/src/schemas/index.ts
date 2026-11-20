import { z } from 'zod';
import {
  UserRole,
  HikingSessionStatus,
  IncidentStatus,
  IncidentPriority,
  IncidentType,
  DetectionSource,
  NotificationChannel,
  NotificationStatus,
  AgentTaskStatus,
  AgentName
} from '../enums';

export const E164_PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email address is required'),
  phone: z.string().regex(E164_PHONE_REGEX, 'Phone must be in E.164 format (e.g. +919876543210)').nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export const EmergencyContactSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  contact_name: z.string().min(1, 'Contact name is required'),
  phone_number: z.string().regex(E164_PHONE_REGEX, 'Phone number must be in E.164 format (e.g. +919876543210)'),
  relationship: z.string().min(1, 'Relationship is required'),
  priority: z.number().int().min(1).default(1),
  created_at: z.string().datetime().optional()
});

export const HikingSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime().nullable().optional(),
  start_location: z.record(z.unknown()).nullable().optional(),
  end_location: z.record(z.unknown()).nullable().optional(),
  status: z.nativeEnum(HikingSessionStatus).default(HikingSessionStatus.ACTIVE),
  created_at: z.string().datetime().optional()
});

export const IncidentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  session_id: z.string().uuid().nullable().optional(),
  incident_type: z.nativeEnum(IncidentType),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  last_known_location_at: z.string().datetime().nullable().optional(),
  priority: z.nativeEnum(IncidentPriority).default(IncidentPriority.HIGH),
  status: z.nativeEnum(IncidentStatus).default(IncidentStatus.DETECTED),
  detection_source: z.nativeEnum(DetectionSource).default(DetectionSource.MANUAL),
  is_demo: z.boolean().default(false),
  created_at: z.string().datetime(),
  synced_at: z.string().datetime().nullable().optional()
});

export const TriageAssessmentSchema = z.object({
  id: z.string().uuid(),
  incident_id: z.string().uuid(),
  consciousness_status: z.string().min(1),
  breathing_difficulty: z.boolean(),
  bleeding_status: z.string().min(1),
  injury_location: z.string().min(1),
  mobility_status: z.string().min(1),
  pain_level: z.number().min(0).max(10),
  assessment_summary: z.string(),
  created_at: z.string().datetime().optional()
});

export const VitalReadingSchema = z.object({
  id: z.string().uuid(),
  incident_id: z.string().uuid(),
  heart_rate_estimate: z.number().positive(),
  signal_quality: z.number().min(0).max(1),
  measurement_duration: z.number().positive(),
  recorded_at: z.string().datetime()
});

export const AgentTaskSchema = z.object({
  id: z.string().uuid(),
  incident_id: z.string().uuid(),
  agent_name: z.nativeEnum(AgentName),
  task_type: z.string().min(1),
  status: z.nativeEnum(AgentTaskStatus).default(AgentTaskStatus.PENDING),
  input_data: z.record(z.unknown()).nullable().optional(),
  output_data: z.record(z.unknown()).nullable().optional(),
  is_demo: z.boolean().default(false),
  created_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().nullable().optional()
});

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  incident_id: z.string().uuid(),
  contact_id: z.string().uuid().nullable().optional(),
  channel: z.nativeEnum(NotificationChannel),
  recipient: z.string().min(1),
  provider_reference: z.string().nullable().optional(),
  status: z.nativeEnum(NotificationStatus).default(NotificationStatus.PENDING),
  error_message: z.string().nullable().optional(),
  is_demo: z.boolean().default(false),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export const LocationHistorySchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().nullable().optional(),
  recorded_at: z.string().datetime()
});

// Idempotent Sync Payload Schema
export const SyncIncidentPayloadSchema = z.object({
  incident: IncidentSchema,
  triage: TriageAssessmentSchema.optional(),
  vitals: z.array(VitalReadingSchema).optional(),
  locations: z.array(LocationHistorySchema).optional()
});
