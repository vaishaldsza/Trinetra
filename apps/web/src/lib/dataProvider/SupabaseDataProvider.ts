import { supabase } from '../supabase';
import {
  IncidentWithRelations,
  HikingSessionStatus,
  IncidentStatus,
  IncidentPriority,
  AgentTask,
  Notification,
  HikingSession,
  LocationHistory
} from '@trinetra/shared';
import {
  DataProvider,
  IncidentFilters,
  HikerSummary,
  HospitalPoint,
  RescueAccessPoint,
  DashboardStats,
  DataUpdateListener
} from './types';
import { SEEDED_HOSPITALS, SEEDED_RESCUE_POINTS } from './mockData';

export const SUPABASE_QUERY_CONFIG = {
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
  ],
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
  agent_tasks: [
    'id',
    'incident_id',
    'agent_name',
    'task_type',
    'status',
    'input_data',
    'output_data',
    'is_demo',
    'created_at',
    'completed_at'
  ],
  notifications: [
    'id',
    'incident_id',
    'contact_id',
    'channel',
    'recipient',
    'provider_reference',
    'status',
    'error_message',
    'is_demo',
    'retry_count',
    'created_at',
    'updated_at'
  ]
} as const;

export const INCIDENT_RELATIONS_SELECT = `
  ${SUPABASE_QUERY_CONFIG.incidents.join(', ')},
  profile:profiles(${SUPABASE_QUERY_CONFIG.profiles.join(', ')}),
  hiking_session:hiking_sessions(${SUPABASE_QUERY_CONFIG.hiking_sessions.join(', ')}),
  triage_assessment:triage_assessments(${SUPABASE_QUERY_CONFIG.triage_assessments.join(', ')}),
  vital_readings:vital_readings(${SUPABASE_QUERY_CONFIG.vital_readings.join(', ')}),
  agent_tasks:agent_tasks(${SUPABASE_QUERY_CONFIG.agent_tasks.join(', ')}),
  notifications:notifications(${SUPABASE_QUERY_CONFIG.notifications.join(', ')})
`;

export class SupabaseDataProvider implements DataProvider {
  public readonly isMock = false;
  private listeners: Set<DataUpdateListener> = new Set();
  private realtimeChannel: any = null;
  private client: any;

  constructor(customClient?: any) {
    this.client = customClient || supabase;
    this.setupRealtimeSubscription();
  }

  private setupRealtimeSubscription(): void {
    try {
      this.realtimeChannel = this.client
        .channel('web-dashboard-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'incidents' },
          (payload: any) => {
            const eventType = payload.eventType === 'INSERT' ? 'incident_created' : 'incident_updated';
            this.listeners.forEach((listener) => {
              listener({
                type: eventType,
                timestamp: new Date().toISOString(),
                incidentId: payload.new?.id,
                data: payload.new,
                message: `[REALTIME] Incident ${payload.eventType.toLowerCase()}`
              });
            });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications' },
          (payload: any) => {
            this.listeners.forEach((listener) => {
              listener({
                type: 'notification_sent',
                timestamp: new Date().toISOString(),
                incidentId: payload.new?.incident_id,
                data: payload.new,
                message: `[REALTIME] Notification ${payload.new?.channel} status: ${payload.new?.status}`
              });
            });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'agent_tasks' },
          (payload: any) => {
            this.listeners.forEach((listener) => {
              listener({
                type: 'agent_task_updated',
                timestamp: new Date().toISOString(),
                incidentId: payload.new?.incident_id,
                data: payload.new,
                message: `[REALTIME] Agent ${payload.new?.agent_name} task ${payload.new?.status}`
              });
            });
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription skipped or unavailable:', err);
    }
  }

  public subscribe(listener: DataUpdateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public toggleRealtimeSimulation(_enable?: boolean): boolean {
    return false; // Live provider does not simulate
  }

  public isRealtimeSimulationActive(): boolean {
    return false;
  }

  public async getIncidents(filters?: IncidentFilters): Promise<IncidentWithRelations[]> {
    try {
      // Check current user role: non-admins see only their own incidents
      const { data: { user } } = await this.client.auth.getUser();
      let query = this.client
        .from('incidents')
        .select(INCIDENT_RELATIONS_SELECT)
        .order('created_at', { ascending: false });

      if (user) {
        const { data: profile } = await this.client
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.role !== 'admin') {
          query = query.eq('user_id', user.id);
        }
      }

      if (filters?.status && filters.status !== 'ALL') {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority && filters.priority !== 'ALL') {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.source && filters.source !== 'ALL') {
        query = query.eq('detection_source', filters.source);
      }
      if (filters?.demoOnly !== undefined && filters.demoOnly !== 'ALL') {
        query = query.eq('is_demo', filters.demoOnly);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as IncidentWithRelations[]) || [];
    } catch (err) {
      console.error('Error fetching incidents from Supabase:', err);
      return [];
    }
  }

  public async getIncident(id: string): Promise<IncidentWithRelations | null> {
    try {
      const { data, error } = await this.client
        .from('incidents')
        .select(INCIDENT_RELATIONS_SELECT)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Also query location_history for this incident's session
      if (data.session_id) {
        const { data: locations } = await this.client
          .from('location_history')
          .select(SUPABASE_QUERY_CONFIG.location_history.join(', '))
          .eq('session_id', data.session_id)
          .order('recorded_at', { ascending: true });

        (data as any).location_history = (locations as LocationHistory[]) || [];
      }

      return data as IncidentWithRelations;
    } catch (err) {
      console.error(`Error fetching incident ${id} from Supabase:`, err);
      return null;
    }
  }

  public async getHikers(): Promise<HikerSummary[]> {
    try {
      const { data } = await this.client.from('profiles').select(SUPABASE_QUERY_CONFIG.profiles.join(', '));
      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.full_name || 'Hiker',
        phone: p.phone || 'N/A',
        trailName: 'Active Sector',
        status: 'active',
        lastSeenAt: p.updated_at || new Date().toISOString(),
        latitude: 32.24,
        longitude: 77.18,
        batteryPercent: 85
      }));
    } catch {
      return [];
    }
  }

  public async getSessions(status?: HikingSessionStatus): Promise<HikingSession[]> {
    try {
      let q = this.client
        .from('hiking_sessions')
        .select(SUPABASE_QUERY_CONFIG.hiking_sessions.join(', '))
        .order('start_time', { ascending: false });
      if (status) q = q.eq('status', status);
      const { data } = await q;
      return (data as HikingSession[]) || [];
    } catch {
      return [];
    }
  }

  public async getAgentTasks(incidentId?: string): Promise<AgentTask[]> {
    try {
      let q = this.client
        .from('agent_tasks')
        .select(SUPABASE_QUERY_CONFIG.agent_tasks.join(', '))
        .order('created_at', { ascending: false });
      if (incidentId) q = q.eq('incident_id', incidentId);
      const { data } = await q;
      return (data as AgentTask[]) || [];
    } catch {
      return [];
    }
  }

  public async getNotifications(incidentId?: string): Promise<Notification[]> {
    try {
      let q = this.client
        .from('notifications')
        .select(SUPABASE_QUERY_CONFIG.notifications.join(', '))
        .order('created_at', { ascending: false });
      if (incidentId) q = q.eq('incident_id', incidentId);
      const { data } = await q;
      return (data as Notification[]) || [];
    } catch {
      return [];
    }
  }

  public async getHospitals(): Promise<HospitalPoint[]> {
    return SEEDED_HOSPITALS;
  }

  public async getRescueAccessPoints(): Promise<RescueAccessPoint[]> {
    return SEEDED_RESCUE_POINTS;
  }

  public async getStats(): Promise<DashboardStats> {
    try {
      const incidents = await this.getIncidents();
      const notifs = await this.getNotifications();
      const activeIncidents = incidents.filter(i => i.status !== IncidentStatus.RESOLVED && i.status !== IncidentStatus.CANCELLED).length;
      const criticalIncidents = incidents.filter(i => i.priority === IncidentPriority.CRITICAL && i.status !== IncidentStatus.RESOLVED).length;
      const resolvedIncidents = incidents.filter(i => i.status === IncidentStatus.RESOLVED).length;

      return {
        activeHikers: 4,
        activeSessions: 2,
        totalIncidents: incidents.length,
        activeIncidents,
        resolvedIncidents,
        criticalIncidents,
        pendingNotifications: notifs.filter(n => n.status === 'pending').length,
        dispatchedNotifications: notifs.filter(n => n.status !== 'pending').length
      };
    } catch {
      return {
        activeHikers: 0,
        activeSessions: 0,
        totalIncidents: 0,
        activeIncidents: 0,
        resolvedIncidents: 0,
        criticalIncidents: 0,
        pendingNotifications: 0,
        dispatchedNotifications: 0
      };
    }
  }

  public async resetDemoData(): Promise<{ deletedCount: number }> {
    try {
      const { data: { user } } = await this.client.auth.getUser();
      if (!user) return { deletedCount: 0 };

      const { data: profile } = await this.client
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      let query = this.client
        .from('incidents')
        .delete()
        .eq('is_demo', true);

      // In live mode it may only delete is_demo = true rows the caller can access
      if (profile?.role !== 'admin') {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.select('id');
      if (error) throw error;
      return { deletedCount: data?.length || 0 };
    } catch (err) {
      console.error('Error resetting demo data in Supabase:', err);
      return { deletedCount: 0 };
    }
  }
}
