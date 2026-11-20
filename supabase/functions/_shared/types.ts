import {
  AgentName,
  AgentTask,
  AgentTaskStatus,
  EmergencyContact,
  Incident,
  Notification,
  NotificationChannel,
  NotificationStatus,
  TriageAssessment,
  VitalReading
} from '@trinetra/shared';

export interface HospitalResult {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distanceKm: number;
  phone?: string;
  emergencyDepartment?: boolean;
}

export interface OverpassClient {
  findNearbyHospitals(lat: number, lon: number, radiusMeters?: number): Promise<HospitalResult[]>;
}

export interface TwilioSendResult {
  success: boolean;
  sid?: string;
  error?: string;
}

export interface TwilioClient {
  isConfigured(): boolean;
  sendSms(to: string, message: string): Promise<TwilioSendResult>;
  makeVoiceCall(to: string, audioUrlOrTwiml: string): Promise<TwilioSendResult>;
}

export interface ElevenLabsClient {
  isConfigured(): boolean;
  synthesizeSpeech(text: string): Promise<{ success: boolean; audioUrl?: string; error?: string }>;
}

export interface AgentverseClient {
  isConfigured(): boolean;
  dispatchTask(agentName: AgentName, payload: Record<string, unknown>): Promise<{
    success: boolean;
    output?: Record<string, unknown>;
    error?: string;
  }>;
}

export interface DatabaseClient {
  getIncident(id: string): Promise<Incident | null>;
  getEmergencyContacts(userId: string): Promise<EmergencyContact[]>;
  createAgentTask(task: Omit<AgentTask, 'id'> & { id?: string }): Promise<AgentTask>;
  getAgentTask(id: string): Promise<AgentTask | null>;
  updateAgentTask(id: string, updates: Partial<AgentTask>): Promise<void>;
  createNotification(notif: Omit<Notification, 'id'> & { id?: string }): Promise<Notification>;
  getNotification(id: string): Promise<Notification | null>;
  updateNotification(id: string, updates: Partial<Notification>): Promise<void>;
  getRetryScheduledNotifications(): Promise<Notification[]>;
  getTriageAssessment(incidentId: string): Promise<TriageAssessment | null>;
  getVitalReadings(incidentId: string): Promise<VitalReading[]>;
}
