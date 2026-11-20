export interface DemoScenarioStep {
  stepNumber: number;
  title: string;
  narration: string;
  dataBadge?: string;
  simulatedAction: string;
  payloadSummary?: Record<string, unknown>;
}

export interface DemoScenarioDefinition {
  id: 'hiking_fall' | 'critical_emergency' | 'remote_trail' | 'rescue_coordination';
  title: string;
  subtitle: string;
  estimatedDurationSec: number;
  steps: DemoScenarioStep[];
}

export const DEMO_SCENARIOS: DemoScenarioDefinition[] = [
  {
    id: 'hiking_fall',
    title: 'Scenario 1: Hiking Fall Detection',
    subtitle: 'Kinematic impact threshold trigger, 30s countdown, automated triage & incident dispatch',
    estimatedDurationSec: 5,
    steps: [
      {
        stepNumber: 1,
        title: 'Sensor Spike & Kinematic Detection',
        narration: 'Hiker encounters loose shale on steep scree. Accelerometer detects free-fall (<0.4g for 150ms) followed immediately by severe impact spike (>2.8g) and sudden stillness (<0.15g).',
        dataBadge: 'ACCEL_TRIGGER: FREE_FALL + IMPACT',
        simulatedAction: 'Kinematic algorithm flags potential fall event.'
      },
      {
        stepNumber: 2,
        title: 'Safety Countdown & Warning Vibration',
        narration: 'System initiates 30-second emergency alert countdown with repeating vibration pattern. Hiker is unable to dismiss the alert due to injury.',
        dataBadge: 'COUNTDOWN_ACTIVE: 30s',
        simulatedAction: 'Vibration pattern triggered; auto-escalation timer engaged.'
      },
      {
        stepNumber: 3,
        title: 'Emergency SOS Confirmation',
        narration: 'Countdown expires (or confirmed by hiker). System registers SOS incident #inc-fall-demo with detection_source = "fall", priority = CRITICAL, and last known GPS coordinates.',
        dataBadge: 'INCIDENT_CREATED [DEMO]',
        simulatedAction: 'Incident saved to local SQLite database.',
        payloadSummary: {
          detection_source: 'fall',
          priority: 'critical',
          status: 'emergency_initiated',
          is_demo: true
        }
      },
      {
        stepNumber: 4,
        title: 'Offline Voice Triage Engagement',
        narration: 'Voice engine speaks: "TRINETRA Emergency. Are you conscious and can you breathe?" Answers recorded: consciousness=responsive, breathing_difficulty=false, pain=8.',
        dataBadge: 'TRIAGE_COMPLETED [DEMO]',
        simulatedAction: 'Structured assessment evaluated via local rule engine.',
        payloadSummary: {
          consciousness: 'responsive',
          bleeding: 'minor',
          pain_level: 8,
          mobility: 'immobile'
        }
      },
      {
        stepNumber: 5,
        title: 'Incident Stored & Queued for Sync',
        narration: 'Incident, triage record, and GPS breadcrumbs committed offline. Background sync engine marks payload pending cloud dispatch.',
        dataBadge: 'LOCAL_PERSISTED: SQLITE',
        simulatedAction: 'Local storage complete; ready for cloud synchronization.'
      }
    ]
  },
  {
    id: 'critical_emergency',
    title: 'Scenario 2: Critical Emergency (Unconscious Hiker)',
    subtitle: 'Unresponsive hiker assessment, instant priority escalation, and optical vital estimation',
    estimatedDurationSec: 5,
    steps: [
      {
        stepNumber: 1,
        title: 'Distress Beacon / Voice Triage Prompt',
        narration: 'Hiker companion or system prompts triage assessment following severe fall near glacier approach.',
        dataBadge: 'ASSESSMENT_TRIGGERED',
        simulatedAction: 'System initiates high-urgency triage questionnaire.'
      },
      {
        stepNumber: 2,
        title: 'Unconscious Status Detected',
        narration: 'Companion reports consciousness_status = "unconscious" with labored breathing. Local Rule Engine detects critical threshold.',
        dataBadge: 'CRITICAL_SIGN: UNCONSCIOUS',
        simulatedAction: 'evaluateTriageRules() flags immediate critical escalation.',
        payloadSummary: {
          consciousness_status: 'unconscious',
          breathing_difficulty: true
        }
      },
      {
        stepNumber: 3,
        title: 'Zero-Delay Priority Escalation',
        narration: 'System immediately bypasses countdowns and escalates incident priority to CRITICAL. Autonomous dispatch sequence primed.',
        dataBadge: 'PRIORITY: CRITICAL (IMMEDIATE)',
        simulatedAction: 'Emergency incident created with highest dispatch priority.'
      },
      {
        stepNumber: 4,
        title: 'Camera PPG Optical Vitals Logged',
        narration: 'Optical PPG algorithm records pulse reading: 44 BPM (simulated value, non-diagnostic, quality 0.88). Reading saved as non-diagnostic estimate with is_demo = true.',
        dataBadge: 'VITALS_ESTIMATE: 44 BPM [DEMO]',
        simulatedAction: 'Vitals record linked directly to incident ID in SQLite.',
        payloadSummary: {
          heart_rate_estimate: 44,
          signal_quality: 0.88,
          is_demo: true,
          label: 'NON-DIAGNOSTIC ESTIMATE'
        }
      },
      {
        stepNumber: 5,
        title: 'Tactical SAR Mobilization Primed',
        narration: 'Emergency report compiles critical trauma score, vital signs trend, and elevation profile for immediate Mountain Rescue mobilization.',
        dataBadge: 'DISPATCH_PRIMED [DEMO]',
        simulatedAction: 'Offline payload sealed with full medical dossier.'
      }
    ]
  },
  {
    id: 'remote_trail',
    title: 'Scenario 3: Remote Trail Without Internet',
    subtitle: 'Simulated network severance, resilient offline queueing, zero-crash local UI, and auto-sync on reconnect',
    estimatedDurationSec: 5,
    steps: [
      {
        stepNumber: 1,
        title: 'Simulated Network Disconnect',
        narration: 'Hiker descends into isolated mountain gorge. Simulated network flag toggles offline. Real device network remains untouched.',
        dataBadge: 'NETWORK: SIMULATED_OFFLINE',
        simulatedAction: 'Sync engine sets network disconnected state.'
      },
      {
        stepNumber: 2,
        title: 'Offline Incident & Triage Creation',
        narration: 'Hiker triggers SOS. Incident #inc-offline-demo and structured voice triage are committed directly to SQLite without throwing network errors.',
        dataBadge: 'OFFLINE_PERSISTED',
        simulatedAction: 'Mutations written to SQLite tables; zero cloud dependency.',
        payloadSummary: {
          table: 'local_incidents',
          storage: 'SQLite',
          cloud_error: 'none'
        }
      },
      {
        stepNumber: 3,
        title: 'Sync Queue Item Enqueued',
        narration: 'Sync engine enqueues mutations: status = "pending", attempts = 0. UI displays "Pending Sync: 1" status badge in Settings and header.',
        dataBadge: 'QUEUE_STATUS: PENDING',
        simulatedAction: 'sync_queue table records mutation payload.'
      },
      {
        stepNumber: 4,
        title: 'Simulated Network Reconnect',
        narration: 'Hiker ascends to ridge opening. Simulated network flag toggles back online. expo-network listener triggers automatic sync cycle.',
        dataBadge: 'NETWORK: RECONNECTED',
        simulatedAction: 'Sync engine automatically resumes batch dispatch.'
      },
      {
        stepNumber: 5,
        title: 'Batch Sync Completion',
        narration: 'Mutations processed in relational order (session -> incident -> triage -> vitals). Item status transitions from pending to synced.',
        dataBadge: 'SYNC_STATUS: SYNCED [DEMO]',
        simulatedAction: 'Sync queue transitions to synced; 0 failures recorded.'
      }
    ]
  },
  {
    id: 'rescue_coordination',
    title: 'Scenario 4: Rescue Coordination & Medical Swarm',
    subtitle: 'Overpass facility discovery, multi-agent medical dossier, and simulated carrier notifications',
    estimatedDurationSec: 5,
    steps: [
      {
        stepNumber: 1,
        title: 'Incident GPS Fix & GIS Query',
        narration: 'Distress coordinates locked: Lat 32.2432, Lon 77.1892 (Solang Valley, Himachal Pradesh). Altitude: 2,480m.',
        dataBadge: 'COORDINATES_LOCKED',
        simulatedAction: 'Geospatial boundary box calculated for trauma facilities.'
      },
      {
        stepNumber: 2,
        title: 'Location Intelligence Agent',
        narration: 'Agent discovers Civil Hospital Manali (12.4 km, Level 2 Trauma) and Mission Hospital (14.1 km). Computes ground transport time vs air ambulance.',
        dataBadge: 'AGENT: LOCATION_INTELLIGENCE [DEMO]',
        simulatedAction: 'Identified 2 facilities with helipad availability.',
        payloadSummary: {
          nearest_hospital: 'Civil Hospital Manali',
          distance_km: 12.4,
          helipad_available: true
        }
      },
      {
        stepNumber: 3,
        title: 'Medical Intelligence Agent',
        narration: 'Agent synthesizes bilingual medical triage summary: "Adult male, right ankle immobilization, suspected fracture, normotensive pulse 74 bpm."',
        dataBadge: 'AGENT: MEDICAL_INTELLIGENCE [DEMO]',
        simulatedAction: 'Generated SAR handover dossier in English and Hindi.'
      },
      {
        stepNumber: 4,
        title: 'Communication Agent Dispatch Generation',
        narration: 'Generates emergency dispatch scripts for Twilio SMS and ElevenLabs voice delivery to consented emergency contact.',
        dataBadge: 'AGENT: COMMUNICATION [DEMO]',
        simulatedAction: 'Prepared outbound alert payloads.'
      },
      {
        stepNumber: 5,
        title: 'Simulated Outbound Delivery (Demo Guard)',
        narration: 'Demo Guard Interception: is_demo = true. Real Twilio SMS and ElevenLabs voice calls are completely suppressed! Statuses logged as [SIMULATED].',
        dataBadge: 'DISPATCH: SIMULATED [REAL BLOCKED]',
        simulatedAction: 'Carrier dispatch blocked; test verified zero external charges.',
        payloadSummary: {
          twilio_sms: 'SIMULATED (carrier skipped)',
          elevenlabs_voice: 'SIMULATED (audio skipped)',
          is_demo: true
        }
      }
    ]
  }
];
