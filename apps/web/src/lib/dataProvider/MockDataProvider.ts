import {
  IncidentWithRelations,
  HikingSessionStatus,
  IncidentPriority,
  IncidentStatus,
  IncidentType,
  DetectionSource,
  AgentName,
  AgentTaskStatus,
  NotificationChannel,
  NotificationStatus,
  AgentTask,
  Notification,
  HikingSession,
  UserRole
} from '@trinetra/shared';
import {
  DataProvider,
  IncidentFilters,
  HikerSummary,
  HospitalPoint,
  RescueAccessPoint,
  DashboardStats,
  DataUpdateListener,
  DataUpdateEvent
} from './types';
import {
  SEEDED_INCIDENTS,
  SEEDED_HIKERS,
  SEEDED_HOSPITALS,
  SEEDED_RESCUE_POINTS,
  SEEDED_SESSIONS
} from './mockData';

export class MockDataProvider implements DataProvider {
  public readonly isMock = true;

  private incidents: IncidentWithRelations[] = [];
  private hikers: HikerSummary[] = [];
  private sessions: HikingSession[] = [];
  private hospitals: HospitalPoint[] = [];
  private rescuePoints: RescueAccessPoint[] = [];

  private listeners: Set<DataUpdateListener> = new Set();
  private simulationInterval: NodeJS.Timeout | null = null;
  private isSimulationEnabled = true;

  constructor() {
    this.incidents = JSON.parse(JSON.stringify(SEEDED_INCIDENTS));
    this.hikers = JSON.parse(JSON.stringify(SEEDED_HIKERS));
    this.sessions = JSON.parse(JSON.stringify(SEEDED_SESSIONS));
    this.hospitals = JSON.parse(JSON.stringify(SEEDED_HOSPITALS));
    this.rescuePoints = JSON.parse(JSON.stringify(SEEDED_RESCUE_POINTS));

    // Start auto simulation by default
    this.startSimulationTimer();
  }

  public subscribe(listener: DataUpdateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(event: DataUpdateEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in mock data listener:', err);
      }
    });
  }

  public toggleRealtimeSimulation(enable?: boolean): boolean {
    if (enable !== undefined) {
      this.isSimulationEnabled = enable;
    } else {
      this.isSimulationEnabled = !this.isSimulationEnabled;
    }

    if (this.isSimulationEnabled) {
      this.startSimulationTimer();
    } else {
      this.stopSimulationTimer();
    }

    return this.isSimulationEnabled;
  }

  public isRealtimeSimulationActive(): boolean {
    return this.isSimulationEnabled;
  }

  private startSimulationTimer(): void {
    if (this.simulationInterval) return;
    this.simulationInterval = setInterval(() => {
      this.simulateNextEvent();
    }, 30000); // 30s interval
  }

  private stopSimulationTimer(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  private simulateNextEvent(): void {
    // Randomly choose between creating a new incident or moving a hiker
    const coinFlip = Math.random() > 0.4;
    if (coinFlip) {
      this.triggerManualIncident();
    } else {
      this.simulateHikerMovement();
    }
  }

  private simulateHikerMovement(): void {
    if (this.hikers.length === 0) return;
    const hiker = this.hikers[Math.floor(Math.random() * this.hikers.length)];
    const latDelta = (Math.random() - 0.5) * 0.002;
    const lonDelta = (Math.random() - 0.5) * 0.002;

    hiker.latitude = Number((hiker.latitude + latDelta).toFixed(5));
    hiker.longitude = Number((hiker.longitude + lonDelta).toFixed(5));
    hiker.lastSeenAt = new Date().toISOString();
    hiker.batteryPercent = Math.max(5, hiker.batteryPercent - 1);

    this.notify({
      type: 'hiker_moved',
      timestamp: new Date().toISOString(),
      data: hiker,
      message: `Hiker ${hiker.name} position updated via GPS satellite beacon.`
    });
  }

  public async triggerManualIncident(): Promise<IncidentWithRelations> {
    const simIndex = this.incidents.length + 1;
    const now = new Date().toISOString();
    const lat = Number((32.25 + (Math.random() - 0.5) * 0.15).toFixed(4));
    const lon = Number((77.18 + (Math.random() - 0.5) * 0.15).toFixed(4));

    const trailNames = ['Hampta Pass Ridge', 'Bhrigu Lake Moraine', 'Friendship Peak Approach', 'Chanderkhani Pass'];
    const selectedTrail = trailNames[Math.floor(Math.random() * trailNames.length)];

    const newIncident: IncidentWithRelations = {
      id: `inc-live-${simIndex}`,
      user_id: `u-sim-${simIndex}`,
      session_id: `sess-sim-${simIndex}`,
      incident_type: Math.random() > 0.5 ? IncidentType.FALL_DETECTED : IncidentType.MANUAL_SOS,
      latitude: lat,
      longitude: lon,
      last_known_location_at: now,
      priority: Math.random() > 0.4 ? IncidentPriority.CRITICAL : IncidentPriority.HIGH,
      status: IncidentStatus.EMERGENCY_INITIATED,
      detection_source: Math.random() > 0.5 ? DetectionSource.ACCELEROMETER : DetectionSource.MANUAL,
      is_demo: true,
      created_at: now,
      synced_at: now,
      profile: {
        id: `u-sim-${simIndex}`,
        full_name: `Hiker Demo ${simIndex} (${selectedTrail.split(' ')[0]})`,
        email: `hiker${simIndex}@demo.safety`,
        phone: `+9198765430${simIndex}`,
        role: UserRole.USER,
        created_at: now
      },
      hiking_session: {
        id: `sess-sim-${simIndex}`,
        user_id: `u-sim-${simIndex}`,
        start_time: now,
        end_time: null,
        status: HikingSessionStatus.EMERGENCY_ACTIVE,
        start_location: { latitude: lat, longitude: lon, trail: selectedTrail }
      },
      triage_assessment: {
        id: `tri-sim-${simIndex}`,
        incident_id: `inc-live-${simIndex}`,
        consciousness_status: 'responsive',
        breathing_difficulty: true,
        bleeding_status: 'minor',
        injury_location: 'Right ankle / suspected sprain',
        mobility_status: 'immobile',
        pain_level: 7,
        assessment_summary: `[DEMO REALTIME EVENT] Sensor threshold exceeded on ${selectedTrail}. Automated voice triage recorded distress keywords.`,
        created_at: now
      },
      vital_readings: [
        {
          id: `vit-sim-${simIndex}`,
          incident_id: `inc-live-${simIndex}`,
          heart_rate_estimate: Math.floor(100 + Math.random() * 35),
          signal_quality: 0.92,
          measurement_duration: 30,
          is_demo: true,
          recorded_at: now
        }
      ],
      agent_tasks: [
        {
          id: `task-sim-${simIndex}-1`,
          incident_id: `inc-live-${simIndex}`,
          agent_name: AgentName.LOCATION_INTELLIGENCE,
          task_type: 'hospital_lookup',
          status: AgentTaskStatus.COMPLETED,
          input_data: { latitude: lat, longitude: lon },
          output_data: { summary: 'Computed nearest medical center at 8.4 km.', isSimulated: true },
          is_demo: true,
          created_at: now
        },
        {
          id: `task-sim-${simIndex}-2`,
          incident_id: `inc-live-${simIndex}`,
          agent_name: AgentName.COMMUNICATION,
          task_type: 'alert_generation',
          status: AgentTaskStatus.COMPLETED,
          output_data: { summary: 'Generated emergency dispatch script [DEMO].', isSimulated: true },
          is_demo: true,
          created_at: now
        }
      ],
      notifications: [
        {
          id: `notif-sim-${simIndex}`,
          incident_id: `inc-live-${simIndex}`,
          channel: NotificationChannel.SMS,
          recipient: '+919876543210',
          status: NotificationStatus.DELIVERED,
          provider_reference: `DEMO-REF-${simIndex}`,
          error_message: '[DEMO] Notification simulated. Real outbound dispatches suppressed in Demo Mode.',
          is_demo: true,
          retry_count: 0,
          created_at: now
        }
      ]
    };

    // Prepend to top
    this.incidents.unshift(newIncident);

    this.notify({
      type: 'incident_created',
      timestamp: now,
      incidentId: newIncident.id,
      data: newIncident,
      message: `[REALTIME] New ${newIncident.priority.toUpperCase()} incident detected on ${selectedTrail}!`
    });

    return newIncident;
  }

  public async getIncidents(filters?: IncidentFilters): Promise<IncidentWithRelations[]> {
    let result = [...this.incidents];

    if (!filters) return result;

    if (filters.status && filters.status !== 'ALL') {
      result = result.filter(i => i.status === filters.status);
    }

    if (filters.priority && filters.priority !== 'ALL') {
      result = result.filter(i => i.priority === filters.priority);
    }

    if (filters.source && filters.source !== 'ALL') {
      result = result.filter(i => i.detection_source === filters.source);
    }

    if (filters.demoOnly !== undefined && filters.demoOnly !== 'ALL') {
      result = result.filter(i => i.is_demo === filters.demoOnly);
    }

    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(i => {
        const idMatch = i.id.toLowerCase().includes(q);
        const nameMatch = i.profile?.full_name?.toLowerCase().includes(q);
        const trailMatch = (i.hiking_session?.start_location as any)?.trail?.toLowerCase()?.includes(q);
        const summaryMatch = i.triage_assessment?.assessment_summary?.toLowerCase()?.includes(q);
        return idMatch || nameMatch || trailMatch || summaryMatch;
      });
    }

    return result;
  }

  public async getIncident(id: string): Promise<IncidentWithRelations | null> {
    return this.incidents.find(i => i.id === id) || null;
  }

  public async getHikers(): Promise<HikerSummary[]> {
    return [...this.hikers];
  }

  public async getSessions(status?: HikingSessionStatus): Promise<HikingSession[]> {
    if (!status) return [...this.sessions];
    return this.sessions.filter(s => s.status === status);
  }

  public async getAgentTasks(incidentId?: string): Promise<AgentTask[]> {
    if (incidentId) {
      const inc = this.incidents.find(i => i.id === incidentId);
      return inc?.agent_tasks || [];
    }
    const allTasks: AgentTask[] = [];
    for (const inc of this.incidents) {
      if (inc.agent_tasks) allTasks.push(...inc.agent_tasks);
    }
    return allTasks;
  }

  public async getNotifications(incidentId?: string): Promise<Notification[]> {
    if (incidentId) {
      const inc = this.incidents.find(i => i.id === incidentId);
      return inc?.notifications || [];
    }
    const allNotifs: Notification[] = [];
    for (const inc of this.incidents) {
      if (inc.notifications) allNotifs.push(...inc.notifications);
    }
    return allNotifs;
  }

  public async getHospitals(): Promise<HospitalPoint[]> {
    return [...this.hospitals];
  }

  public async getRescueAccessPoints(): Promise<RescueAccessPoint[]> {
    return [...this.rescuePoints];
  }

  public async getStats(): Promise<DashboardStats> {
    const activeIncidents = this.incidents.filter(
      i => i.status !== IncidentStatus.RESOLVED && i.status !== IncidentStatus.CANCELLED
    ).length;

    const criticalIncidents = this.incidents.filter(
      i => i.priority === IncidentPriority.CRITICAL && i.status !== IncidentStatus.RESOLVED
    ).length;

    const resolvedIncidents = this.incidents.filter(
      i => i.status === IncidentStatus.RESOLVED
    ).length;

    const allNotifs = await this.getNotifications();
    const pendingNotifications = allNotifs.filter(
      n => n.status === NotificationStatus.PENDING || n.status === NotificationStatus.PROCESSING
    ).length;

    return {
      activeHikers: this.hikers.length,
      activeSessions: this.sessions.filter(s => s.status === HikingSessionStatus.ACTIVE || s.status === HikingSessionStatus.EMERGENCY_ACTIVE).length,
      totalIncidents: this.incidents.length,
      activeIncidents,
      resolvedIncidents,
      criticalIncidents,
      pendingNotifications,
      dispatchedNotifications: allNotifs.length - pendingNotifications
    };
  }

  public async resetDemoData(): Promise<{ deletedCount: number }> {
    const prevCount = this.incidents.length;
    // Delete only is_demo rows
    this.incidents = this.incidents.filter(i => !i.is_demo);
    this.sessions = this.sessions.filter(s => !(s as any).is_demo);
    this.hikers = this.hikers.filter(h => !(h as any).is_demo);
    const deletedCount = prevCount - this.incidents.length;

    this.notify({
      type: 'incident_updated',
      timestamp: new Date().toISOString(),
      data: { reset: true, deletedCount },
      message: `[DEMO RESET] Purged ${deletedCount} demo incident(s) from local mock store.`
    });

    return { deletedCount };
  }
}
