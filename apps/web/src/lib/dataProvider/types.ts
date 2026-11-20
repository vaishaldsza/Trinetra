import {
  Incident,
  IncidentPriority,
  IncidentStatus,
  IncidentType,
  DetectionSource,
  HikingSession,
  HikingSessionStatus,
  Profile,
  TriageAssessment,
  VitalReading,
  AgentTask,
  AgentTaskStatus,
  AgentName,
  Notification,
  NotificationChannel,
  NotificationStatus,
  IncidentWithRelations
} from '@trinetra/shared';

export interface IncidentFilters {
  status?: IncidentStatus | 'ALL';
  priority?: IncidentPriority | 'ALL';
  source?: DetectionSource | 'ALL';
  demoOnly?: boolean | 'ALL';
  searchQuery?: string;
}

export interface HikerSummary {
  id: string;
  name: string;
  phone: string;
  activeSessionId?: string;
  trailName: string;
  status: 'safe' | 'distress' | 'active';
  lastSeenAt: string;
  latitude: number;
  longitude: number;
  batteryPercent: number;
}

export interface HospitalPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  phone: string;
  hasEmergencyDepartment: boolean;
  type: 'hospital' | 'clinic';
}

export interface RescueAccessPoint {
  id: string;
  name: string;
  type: 'helipad' | 'trailhead' | 'basecamp' | 'ranger_station';
  latitude: number;
  longitude: number;
  elevationMeters: number;
  contactChannel: string;
}

export interface DashboardStats {
  activeHikers: number;
  activeSessions: number;
  totalIncidents: number;
  activeIncidents: number;
  resolvedIncidents: number;
  criticalIncidents: number;
  pendingNotifications: number;
  dispatchedNotifications: number;
}

export type DataUpdateEventType =
  | 'incident_created'
  | 'incident_updated'
  | 'agent_task_updated'
  | 'notification_sent'
  | 'hiker_moved';

export interface DataUpdateEvent {
  type: DataUpdateEventType;
  timestamp: string;
  incidentId?: string;
  data: unknown;
  message: string;
}

export type DataUpdateListener = (event: DataUpdateEvent) => void;

export interface DataProvider {
  isMock: boolean;
  getIncidents(filters?: IncidentFilters): Promise<IncidentWithRelations[]>;
  getIncident(id: string): Promise<IncidentWithRelations | null>;
  getHikers(): Promise<HikerSummary[]>;
  getSessions(status?: HikingSessionStatus): Promise<HikingSession[]>;
  getAgentTasks(incidentId?: string): Promise<AgentTask[]>;
  getNotifications(incidentId?: string): Promise<Notification[]>;
  getHospitals(): Promise<HospitalPoint[]>;
  getRescueAccessPoints(): Promise<RescueAccessPoint[]>;
  getStats(): Promise<DashboardStats>;
  subscribe(listener: DataUpdateListener): () => void;
  toggleRealtimeSimulation(enable?: boolean): boolean;
  isRealtimeSimulationActive(): boolean;
  triggerManualIncident?(): Promise<IncidentWithRelations>;
}
