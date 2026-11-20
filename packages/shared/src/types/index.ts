import { z } from 'zod';
import {
  ProfileSchema,
  EmergencyContactSchema,
  HikingSessionSchema,
  IncidentSchema,
  TriageAssessmentSchema,
  VitalReadingSchema,
  AgentTaskSchema,
  NotificationSchema,
  LocationHistorySchema,
  SyncIncidentPayloadSchema
} from '../schemas';

export type Profile = z.infer<typeof ProfileSchema>;
export type EmergencyContact = z.infer<typeof EmergencyContactSchema>;
export type HikingSession = z.infer<typeof HikingSessionSchema>;
export type Incident = z.infer<typeof IncidentSchema>;
export type TriageAssessment = z.infer<typeof TriageAssessmentSchema>;
export type VitalReading = z.infer<typeof VitalReadingSchema>;
export type AgentTask = z.infer<typeof AgentTaskSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type LocationHistory = z.infer<typeof LocationHistorySchema>;
export type SyncIncidentPayload = z.infer<typeof SyncIncidentPayloadSchema>;

export interface IncidentWithRelations extends Incident {
  profile?: Profile;
  hiking_session?: HikingSession;
  triage_assessment?: TriageAssessment;
  vital_readings?: VitalReading[];
  agent_tasks?: AgentTask[];
  notifications?: Notification[];
}
