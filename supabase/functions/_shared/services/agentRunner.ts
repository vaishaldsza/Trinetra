import {
  AgentName,
  AgentTask,
  AgentTaskStatus
} from '../contracts';
import { DatabaseClient, HospitalResult, OverpassClient, AgentverseClient } from '../types';

export interface AgentExecutionOutput {
  summary: string;
  data: Record<string, unknown>;
  isSimulated: boolean;
}

export interface AgentRunnerDeps {
  db: DatabaseClient;
  overpass: OverpassClient;
  agentverse: AgentverseClient;
}

/**
 * OpenStreetMap Overpass API Hospital Client
 * Queries amenity=hospital or amenity=clinic within radius with timeout and graceful failure.
 */
export class OverpassHospitalClient implements OverpassClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(baseUrl = 'https://overpass-api.de/api/interpreter', timeoutMs = 6000) {
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  public async findNearbyHospitals(
    lat: number,
    lon: number,
    radiusMeters = 30000
  ): Promise<HospitalResult[]> {
    const query = `
      [out:json][timeout:10];
      (
        node["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
        node["amenity"="clinic"](around:${radiusMeters},${lat},${lon});
      );
      out center 5;
    `;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`Overpass API responded with HTTP ${response.status}`);
      }

      interface OverpassNode {
        id: number;
        lat: number;
        lon: number;
        tags?: { name?: string; phone?: string; emergency?: string };
      }

      const json = await response.json() as { elements?: OverpassNode[] };
      const elements = json.elements || [];

      if (elements.length === 0) {
        return this.getFallbackHospitals(lat, lon);
      }

      return elements.map(el => {
        const dKm = this.calculateHaversineDistance(lat, lon, el.lat, el.lon);
        return {
          id: String(el.id),
          name: el.tags?.name || 'Local Medical / Clinic Facility',
          lat: el.lat,
          lon: el.lon,
          distanceKm: Math.round(dKm * 10) / 10,
          phone: el.tags?.phone,
          emergencyDepartment: el.tags?.emergency === 'yes'
        };
      }).sort((a, b) => a.distanceKm - b.distanceKm);
    } catch (err) {
      clearTimeout(timer);
      console.warn('Overpass API lookup failed or timed out. Falling back to local emergency medical cache:', err);
      return this.getFallbackHospitals(lat, lon);
    }
  }

  private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private getFallbackHospitals(lat: number, lon: number): HospitalResult[] {
    return [
      {
        id: 'fallback-hosp-1',
        name: 'Regional District Emergency Hospital [FALLBACK CACHE]',
        lat: lat + 0.08,
        lon: lon + 0.05,
        distanceKm: 12.4,
        phone: '+911902252244',
        emergencyDepartment: true
      },
      {
        id: 'fallback-hosp-2',
        name: 'Community Mountain Clinic [FALLBACK CACHE]',
        lat: lat - 0.04,
        lon: lon - 0.03,
        distanceKm: 6.8,
        phone: '+911902251122',
        emergencyDepartment: false
      }
    ];
  }
}

/**
 * Agentverse Client Adapter
 * Connects to Fetch.ai Agentverse runtime or falls back to local simulation
 */
export class AgentverseClientAdapter implements AgentverseClient {
  private readonly apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  public async dispatchTask(agentName: AgentName, payload: Record<string, unknown>): Promise<{
    success: boolean;
    output?: Record<string, unknown>;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      // Local fallback simulation
      return {
        success: true,
        output: {
          simulated: true,
          agent: agentName,
          result: `[DEMO] Local simulation for ${agentName}`,
          processedAt: new Date().toISOString()
        }
      };
    }

    try {
      // TODO(integration): Connect to Fetch.ai Agentverse / uAgents REST endpoint
      return {
        success: true,
        output: {
          agent: agentName,
          status: 'dispatched_agentverse',
          payload
        }
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: (err as { message?: string })?.message || String(err)
      };
    }
  }
}

/**
 * Executes a single agent task using local simulated intelligence and external APIs.
 */
export async function runAgentTaskLogic(
  taskId: string,
  deps: AgentRunnerDeps
): Promise<AgentTask> {
  const task = await deps.db.getAgentTask(taskId);
  if (!task) {
    throw new Error(`Agent task not found: ${taskId}`);
  }

  await deps.db.updateAgentTask(task.id, {
    status: AgentTaskStatus.PROCESSING
  });

  const incident = await deps.db.getIncident(task.incident_id);
  const lat = incident?.latitude ?? 32.24;
  const lon = incident?.longitude ?? 77.18;

  let resultOutput: AgentExecutionOutput;

  switch (task.agent_name) {
    case AgentName.LOCATION_INTELLIGENCE: {
      const hospitals = await deps.overpass.findNearbyHospitals(lat, lon, 30000);
      resultOutput = {
        summary: `[DEMO] Found ${hospitals.length} nearby medical facilities within 30km. Nearest: ${hospitals[0]?.name} (${hospitals[0]?.distanceKm} km).`,
        data: {
          targetCoordinates: { lat, lon },
          nearestHospitals: hospitals,
          recommendation: hospitals[0]?.emergencyDepartment
            ? `Dispatch patient to ${hospitals[0].name} (Emergency Dept active).`
            : `Stabilize at ${hospitals[0]?.name || 'nearest clinic'} prior to secondary transfer.`
        },
        isSimulated: true
      };
      break;
    }

    case AgentName.MEDICAL_INTELLIGENCE: {
      const triage = await deps.db.getTriageAssessment(task.incident_id);
      const vitals = await deps.db.getVitalReadings(task.incident_id);
      const latestBpm = vitals.length > 0 ? vitals[vitals.length - 1].heart_rate_estimate : 76;

      resultOutput = {
        summary: `[DEMO] Medical analysis complete. Triage: ${triage?.consciousness_status || 'Reported'}. Vitals: ${latestBpm} BPM. Immediate airway & immobilization required.`,
        data: {
          triageSummary: triage?.assessment_summary || 'No detailed triage completed',
          estimatedHeartRate: latestBpm,
          traumaRiskIndex: incident?.priority === 'critical' ? 'HIGH' : 'MODERATE',
          stabilizationChecklist: [
            'Maintain cervical spine stabilization if fall occurred',
            'Cover with thermal emergency blanket to prevent hypothermia',
            'Avoid administering oral liquids if consciousness is fluctuating'
          ]
        },
        isSimulated: true
      };
      break;
    }

    case AgentName.ROUTE_INTELLIGENCE: {
      resultOutput = {
        summary: '[DEMO] Evacuation route calculated: North-Ridge evacuation pass to Highway 3 (approx 3.2km, descent 420m).',
        data: {
          trailName: 'Rohtang North Descent',
          evacuationCorridor: 'Valley Ridge Trail',
          distanceToRoadheadKm: 3.2,
          estimatedLitterCarryTimeMinutes: 55,
          weatherHazardFactor: 'Clear skies, gusting wind 18 km/h'
        },
        isSimulated: true
      };
      break;
    }

    case AgentName.EMERGENCY_COORDINATION: {
      resultOutput = {
        summary: '[DEMO] Mountain Rescue Service & Local EMS team alert packet generated and placed in dispatcher queue.',
        data: {
          leadUnit: 'Himalayan Mountain Rescue Unit 4',
          incidentLevel: incident?.priority === 'critical' ? 'RED / LEVEL 1' : 'AMBER / LEVEL 2',
          dispatchStatus: 'SIMULATED_DISPATCHED',
          airRescueFeasible: true
        },
        isSimulated: true
      };
      break;
    }

    case AgentName.COMMUNICATION: {
      resultOutput = {
        summary: '[DEMO] Emergency situation report (SITREP) formulated for responders and trusted family contacts.',
        data: {
          sitrep: `TRINETRA SITREP #${incident?.id.slice(0, 8)}: Hiker in distress near (${lat.toFixed(4)}, ${lon.toFixed(4)}). Priority: ${incident?.priority.toUpperCase()}. Assistance requested.`,
          notificationsDispatched: true
        },
        isSimulated: true
      };
      break;
    }

    default:
      resultOutput = {
        summary: `[DEMO] Agent ${task.agent_name} processed.`,
        data: { raw: task.input_data },
        isSimulated: true
      };
  }

  await deps.db.updateAgentTask(task.id, {
    status: AgentTaskStatus.COMPLETED,
    output_data: resultOutput.data,
    completed_at: new Date().toISOString()
  });

  return {
    ...task,
    status: AgentTaskStatus.COMPLETED,
    output_data: resultOutput.data,
    completed_at: new Date().toISOString()
  };
}
