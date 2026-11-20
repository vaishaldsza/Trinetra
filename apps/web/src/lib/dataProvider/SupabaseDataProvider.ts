import { supabase } from '../supabase';
import {
  IncidentWithRelations,
  HikingSessionStatus,
  IncidentStatus,
  IncidentPriority,
  AgentTask,
  Notification,
  HikingSession
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

export class SupabaseDataProvider implements DataProvider {
  public readonly isMock = false;
  private listeners: Set<DataUpdateListener> = new Set();
  private realtimeChannel: any = null;

  constructor() {
    this.setupRealtimeSubscription();
  }

  private setupRealtimeSubscription(): void {
    try {
      this.realtimeChannel = supabase
        .channel('web-dashboard-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'incidents' },
          (payload) => {
            const eventType = payload.eventType === 'INSERT' ? 'incident_created' : 'incident_updated';
            this.listeners.forEach((listener) => {
              listener({
                type: eventType,
                timestamp: new Date().toISOString(),
                incidentId: (payload.new as any)?.id,
                data: payload.new,
                message: `[SUPABASE REALTIME] Incident ${payload.eventType.toLowerCase()}`
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
      let query = supabase
        .from('incidents')
        .select(`
          *,
          profile:profiles(*),
          hiking_session:hiking_sessions(*),
          triage_assessment:triage_assessments(*),
          vital_readings:vital_readings(*),
          agent_tasks:agent_tasks(*),
          notifications:notifications(*)
        `)
        .order('created_at', { ascending: false });

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
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          *,
          profile:profiles(*),
          hiking_session:hiking_sessions(*),
          triage_assessment:triage_assessments(*),
          vital_readings:vital_readings(*),
          agent_tasks:agent_tasks(*),
          notifications:notifications(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return (data as IncidentWithRelations) || null;
    } catch (err) {
      console.error(`Error fetching incident ${id} from Supabase:`, err);
      return null;
    }
  }

  public async getHikers(): Promise<HikerSummary[]> {
    try {
      const { data } = await supabase.from('profiles').select('*');
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
      let q = supabase.from('hiking_sessions').select('*').order('start_time', { ascending: false });
      if (status) q = q.eq('status', status);
      const { data } = await q;
      return (data as HikingSession[]) || [];
    } catch {
      return [];
    }
  }

  public async getAgentTasks(incidentId?: string): Promise<AgentTask[]> {
    try {
      let q = supabase.from('agent_tasks').select('*').order('created_at', { ascending: false });
      if (incidentId) q = q.eq('incident_id', incidentId);
      const { data } = await q;
      return (data as AgentTask[]) || [];
    } catch {
      return [];
    }
  }

  public async getNotifications(incidentId?: string): Promise<Notification[]> {
    try {
      let q = supabase.from('notifications').select('*').order('created_at', { ascending: false });
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
}
