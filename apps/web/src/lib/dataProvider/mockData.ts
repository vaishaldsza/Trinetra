import {
  IncidentPriority,
  IncidentStatus,
  IncidentType,
  DetectionSource,
  HikingSessionStatus,
  UserRole,
  AgentName,
  AgentTaskStatus,
  NotificationChannel,
  NotificationStatus,
  IncidentWithRelations,
  Profile,
  HikingSession,
  TriageAssessment,
  VitalReading,
  AgentTask,
  Notification
} from '@trinetra/shared';
import { HospitalPoint, RescueAccessPoint, HikerSummary } from './types';

export const SEEDED_PROFILES: Profile[] = [
  {
    id: 'u-101',
    full_name: 'Rajesh Sharma',
    email: 'rajesh.sharma@hiker.demo',
    phone: '+919876543210',
    avatar_url: null,
    role: UserRole.USER,
    created_at: '2026-11-19T06:00:00Z'
  },
  {
    id: 'u-102',
    full_name: 'Ananya Sen',
    email: 'ananya.sen@hiker.demo',
    phone: '+919876543212',
    avatar_url: null,
    role: UserRole.USER,
    created_at: '2026-11-19T07:30:00Z'
  },
  {
    id: 'u-103',
    full_name: 'Aarav Mehta',
    email: 'aarav.mehta@hiker.demo',
    phone: '+919876543214',
    avatar_url: null,
    role: UserRole.USER,
    created_at: '2026-11-18T10:00:00Z'
  },
  {
    id: 'u-104',
    full_name: 'Vikram Rathore',
    email: 'vikram.rathore@hiker.demo',
    phone: '+919876543216',
    avatar_url: null,
    role: UserRole.USER,
    created_at: '2026-11-17T09:15:00Z'
  }
];

export const SEEDED_SESSIONS: HikingSession[] = [
  {
    id: 'sess-201',
    user_id: 'u-101',
    start_time: '2026-11-20T05:30:00Z',
    end_time: null,
    start_location: { latitude: 32.2396, longitude: 77.1887, trail: 'Solang Valley Ridge' },
    end_location: null,
    status: HikingSessionStatus.EMERGENCY_ACTIVE,
    created_at: '2026-11-20T05:30:00Z'
  },
  {
    id: 'sess-202',
    user_id: 'u-102',
    start_time: '2026-11-20T06:15:00Z',
    end_time: null,
    start_location: { latitude: 32.2215, longitude: 77.2185, trail: 'Hampta Pass Base' },
    end_location: null,
    status: HikingSessionStatus.ACTIVE,
    created_at: '2026-11-20T06:15:00Z'
  },
  {
    id: 'sess-203',
    user_id: 'u-103',
    start_time: '2026-11-20T07:00:00Z',
    end_time: null,
    start_location: { latitude: 32.3712, longitude: 77.2465, trail: 'Rohtang Pass North Corridor' },
    end_location: null,
    status: HikingSessionStatus.EMERGENCY_ACTIVE,
    created_at: '2026-11-20T07:00:00Z'
  },
  {
    id: 'sess-204',
    user_id: 'u-104',
    start_time: '2026-11-20T04:45:00Z',
    end_time: null,
    start_location: { latitude: 32.3255, longitude: 77.1512, trail: 'Beas Kund High Camp' },
    end_location: null,
    status: HikingSessionStatus.COMPLETED,
    created_at: '2026-11-20T04:45:00Z'
  }
];

export const SEEDED_HOSPITALS: HospitalPoint[] = [
  {
    id: 'hosp-1',
    name: 'Manali Civil Hospital (Govt)',
    latitude: 32.2432,
    longitude: 77.1892,
    distanceKm: 4.2,
    phone: '+91-1902-252244',
    hasEmergencyDepartment: true,
    type: 'hospital'
  },
  {
    id: 'hosp-2',
    name: 'Lady Willingdon Hospital (Mission Hospital Manali)',
    latitude: 32.2478,
    longitude: 77.1865,
    distanceKm: 4.8,
    phone: '+91-1902-252379',
    hasEmergencyDepartment: true,
    type: 'hospital'
  },
  {
    id: 'hosp-3',
    name: 'Regional Hospital Kullu (Tertiary Care & Trauma)',
    latitude: 31.9578,
    longitude: 77.1086,
    distanceKm: 34.5,
    phone: '+91-1902-222350',
    hasEmergencyDepartment: true,
    type: 'hospital'
  },
  {
    id: 'hosp-4',
    name: 'Primary Health Centre Naggar',
    latitude: 32.1415,
    longitude: 77.1689,
    distanceKm: 16.1,
    phone: '+91-1902-248122',
    hasEmergencyDepartment: false,
    type: 'clinic'
  }
];

export const SEEDED_RESCUE_POINTS: RescueAccessPoint[] = [
  {
    id: 'rap-1',
    name: 'Solang Valley Ground Helipad (SAR Zone A)',
    type: 'helipad',
    latitude: 32.3167,
    longitude: 77.1568,
    elevationMeters: 2560,
    contactChannel: 'VHF Ch 16 / Sat: +88216-2244-9988'
  },
  {
    id: 'rap-2',
    name: 'Dhundi ITBP Mountain Rescue Outpost',
    type: 'ranger_station',
    latitude: 32.3551,
    longitude: 77.1292,
    elevationMeters: 2840,
    contactChannel: 'HF 4125 kHz / Phone: +91-1902-277112'
  },
  {
    id: 'rap-3',
    name: 'Marhi Emergency Shelter & Evacuation Point',
    type: 'basecamp',
    latitude: 32.3482,
    longitude: 77.2185,
    elevationMeters: 3320,
    contactChannel: 'VHF Ch 09 / Satellite Radio 406 MHz'
  }
];

export const SEEDED_HIKERS: HikerSummary[] = [
  {
    id: 'u-101',
    name: 'Rajesh Sharma',
    phone: '+919876543210',
    activeSessionId: 'sess-201',
    trailName: 'Solang Ridge to Dhundi',
    status: 'distress',
    lastSeenAt: '2026-11-20T08:15:22Z',
    latitude: 32.3214,
    longitude: 77.1542,
    batteryPercent: 42
  },
  {
    id: 'u-102',
    name: 'Ananya Sen',
    phone: '+919876543212',
    activeSessionId: 'sess-202',
    trailName: 'Hampta Pass Trail (Jobra to Chika)',
    status: 'active',
    lastSeenAt: '2026-11-20T08:18:10Z',
    latitude: 32.2285,
    longitude: 77.2250,
    batteryPercent: 88
  },
  {
    id: 'u-103',
    name: 'Aarav Mehta',
    phone: '+919876543214',
    activeSessionId: 'sess-203',
    trailName: 'Rohtang North Scree Slope',
    status: 'distress',
    lastSeenAt: '2026-11-20T08:05:40Z',
    latitude: 32.3688,
    longitude: 77.2415,
    batteryPercent: 19
  },
  {
    id: 'u-104',
    name: 'Vikram Rathore',
    phone: '+919876543216',
    activeSessionId: 'sess-204',
    trailName: 'Beas Kund Glacial Basin',
    status: 'safe',
    lastSeenAt: '2026-11-20T07:45:00Z',
    latitude: 32.3255,
    longitude: 77.1512,
    batteryPercent: 65
  }
];

export const SEEDED_INCIDENTS: IncidentWithRelations[] = [
  {
    id: 'inc-001',
    user_id: 'u-101',
    session_id: 'sess-201',
    incident_type: IncidentType.FALL_DETECTED,
    latitude: 32.3214,
    longitude: 77.1542,
    last_known_location_at: '2026-11-20T08:14:00Z',
    priority: IncidentPriority.CRITICAL,
    status: IncidentStatus.EMERGENCY_INITIATED,
    detection_source: DetectionSource.ACCELEROMETER,
    is_demo: true,
    created_at: '2026-11-20T08:14:15Z',
    synced_at: '2026-11-20T08:14:18Z',
    profile: SEEDED_PROFILES[0],
    hiking_session: SEEDED_SESSIONS[0],
    triage_assessment: {
      id: 'tri-001',
      incident_id: 'inc-001',
      consciousness_status: 'responsive',
      breathing_difficulty: true,
      bleeding_status: 'moderate',
      injury_location: 'Right leg, knee laceration and rib contusion',
      mobility_status: 'immobile',
      pain_level: 8,
      assessment_summary: 'Hiker sustained free-fall of approx 2.5m down rocky scree. Severe right knee injury, suspect fracture. Labored breathing. Immobile.',
      created_at: '2026-11-20T08:14:45Z'
    },
    vital_readings: [
      {
        id: 'vit-001',
        incident_id: 'inc-001',
        heart_rate_estimate: 118,
        signal_quality: 0.94,
        measurement_duration: 30,
        is_demo: true,
        recorded_at: '2026-11-20T08:15:00Z'
      },
      {
        id: 'vit-002',
        incident_id: 'inc-001',
        heart_rate_estimate: 122,
        signal_quality: 0.89,
        measurement_duration: 30,
        is_demo: true,
        recorded_at: '2026-11-20T08:17:30Z'
      }
    ],
    agent_tasks: [
      {
        id: 'task-101',
        incident_id: 'inc-001',
        agent_name: AgentName.LOCATION_INTELLIGENCE,
        task_type: 'hospital_lookup',
        status: AgentTaskStatus.COMPLETED,
        input_data: { latitude: 32.3214, longitude: 77.1542, radiusKm: 25 },
        output_data: {
          summary: 'Identified 2 facilities with trauma capacity. Manali Civil Hospital nearest at 4.2 km.',
          nearestHospital: 'Manali Civil Hospital (Govt)',
          distanceKm: 4.2,
          isSimulated: true
        },
        is_demo: true,
        created_at: '2026-11-20T08:14:20Z',
        completed_at: '2026-11-20T08:14:23Z'
      },
      {
        id: 'task-102',
        incident_id: 'inc-001',
        agent_name: AgentName.MEDICAL_INTELLIGENCE,
        task_type: 'triage_vital_analysis',
        status: AgentTaskStatus.COMPLETED,
        input_data: { consciousness: 'responsive', heartRate: 118, pain: 8, mobility: 'immobile' },
        output_data: {
          summary: 'Critical traumatic orthopedic injury with elevated pulse estimate (118 BPM, simulated value, non-diagnostic) and respiratory distress. High risk of shock.',
          urgency: 'IMMEDIATE',
          fieldRecommendations: 'Splint right limb in position found; keep patient insulated against hypothermia; monitor airway.',
          isSimulated: true
        },
        is_demo: true,
        created_at: '2026-11-20T08:14:20Z',
        completed_at: '2026-11-20T08:14:24Z'
      },
      {
        id: 'task-103',
        incident_id: 'inc-001',
        agent_name: AgentName.ROUTE_INTELLIGENCE,
        task_type: 'extraction_route',
        status: AgentTaskStatus.COMPLETED,
        input_data: { latitude: 32.3214, longitude: 77.1542 },
        output_data: {
          summary: 'Best extraction point is Solang Valley Helipad (RAP-1) at 1.4 km bearing 165°. Wheeled stretcher inaccessible; litter carry or aerial hoist required.',
          evacuationCorridor: 'South downhill ridge towards Solang Ropeway station',
          estimatedCarryDurationMin: 45,
          isSimulated: true
        },
        is_demo: true,
        created_at: '2026-11-20T08:14:20Z',
        completed_at: '2026-11-20T08:14:25Z'
      },
      {
        id: 'task-104',
        incident_id: 'inc-001',
        agent_name: AgentName.EMERGENCY_COORDINATION,
        task_type: 'sar_mobilization',
        status: AgentTaskStatus.COMPLETED,
        input_data: { priority: 'critical', location: 'Solang Ridge' },
        output_data: {
          summary: 'Dispatched alert to Manali Mountain Rescue Squad and ITBP Dhundi Sector. Acknowledged by ITBP Duty Officer.',
          notifiedUnits: ['ITBP Mountain Search & Rescue Team 4', 'Manali Mountaineering Institute Volunteers'],
          etaMinutes: 28,
          isSimulated: true
        },
        is_demo: true,
        created_at: '2026-11-20T08:14:20Z',
        completed_at: '2026-11-20T08:14:25Z'
      },
      {
        id: 'task-105',
        incident_id: 'inc-001',
        agent_name: AgentName.COMMUNICATION,
        task_type: 'alert_generation',
        status: AgentTaskStatus.COMPLETED,
        input_data: { recipient: 'Priya Sharma (Sister)', lang: 'en,hi' },
        output_data: {
          summary: 'Prepared bilingual urgent SMS and synthetic voice warning for consented emergency contacts.',
          smsScript: '[TRINETRA CRITICAL ALERT] Rajesh Sharma reported an emergency near Solang Ridge (32.3214, 77.1542). Mountain rescue teams mobilized. Status: Responsive.',
          voiceScript: 'Emergency alert from Trinetra. Critical safety incident recorded for your contact Rajesh Sharma.',
          isSimulated: true
        },
        is_demo: true,
        created_at: '2026-11-20T08:14:20Z',
        completed_at: '2026-11-20T08:14:26Z'
      }
    ],
    notifications: [
      {
        id: 'notif-301',
        incident_id: 'inc-001',
        contact_id: 'c-1',
        channel: NotificationChannel.SMS,
        recipient: '+919876543219',
        status: NotificationStatus.DELIVERED,
        provider_reference: 'DEMO-REF-301-SMS',
        error_message: '[DEMO] Notification simulated. Real outbound dispatches suppressed in Demo Mode.',
        is_demo: true,
        retry_count: 0,
        created_at: '2026-11-20T08:14:28Z',
        updated_at: '2026-11-20T08:14:30Z'
      },
      {
        id: 'notif-302',
        incident_id: 'inc-001',
        contact_id: 'c-1',
        channel: NotificationChannel.VOICE,
        recipient: '+919876543219',
        status: NotificationStatus.DELIVERED,
        provider_reference: 'DEMO-REF-302-VOICE',
        error_message: '[DEMO] Notification simulated. Real outbound dispatches suppressed in Demo Mode.',
        is_demo: true,
        retry_count: 0,
        created_at: '2026-11-20T08:14:29Z',
        updated_at: '2026-11-20T08:14:32Z'
      }
    ]
  },
  {
    id: 'inc-002',
    user_id: 'u-103',
    session_id: 'sess-203',
    incident_type: IncidentType.HEALTH_ANOMALY,
    latitude: 32.3688,
    longitude: 77.2415,
    last_known_location_at: '2026-11-20T08:05:00Z',
    priority: IncidentPriority.HIGH,
    status: IncidentStatus.ASSISTANCE_REQUESTED,
    detection_source: DetectionSource.VITAL_MONITOR,
    is_demo: true,
    created_at: '2026-11-20T08:05:20Z',
    synced_at: '2026-11-20T08:05:25Z',
    profile: SEEDED_PROFILES[2],
    hiking_session: SEEDED_SESSIONS[2],
    triage_assessment: {
      id: 'tri-002',
      incident_id: 'inc-002',
      consciousness_status: 'dizzy_confused',
      breathing_difficulty: true,
      bleeding_status: 'none',
      injury_location: 'Head/chest acute mountain sickness',
      mobility_status: 'limited',
      pain_level: 6,
      assessment_summary: 'Severe acute mountain sickness (AMS) with extreme dizziness, cyanosis in fingers, and elevated pulse (134 BPM, simulated value, non-diagnostic) at 3400m altitude.',
      created_at: '2026-11-20T08:05:50Z'
    },
    vital_readings: [
      {
        id: 'vit-003',
        incident_id: 'inc-002',
        heart_rate_estimate: 134,
        signal_quality: 0.88,
        measurement_duration: 30,
        is_demo: true,
        recorded_at: '2026-11-20T08:05:10Z'
      }
    ],
    agent_tasks: [
      {
        id: 'task-201',
        incident_id: 'inc-002',
        agent_name: AgentName.LOCATION_INTELLIGENCE,
        task_type: 'hospital_lookup',
        status: AgentTaskStatus.COMPLETED,
        input_data: { latitude: 32.3688, longitude: 77.2415 },
        output_data: {
          summary: 'Marhi Emergency Shelter (RAP-3) is 2.8 km away. Has supplemental oxygen concentrator.',
          nearestHospital: 'Manali Civil Hospital',
          distanceKm: 18.2,
          isSimulated: true
        },
        is_demo: true,
        created_at: '2026-11-20T08:05:22Z'
      },
      {
        id: 'task-202',
        incident_id: 'inc-002',
        agent_name: AgentName.MEDICAL_INTELLIGENCE,
        task_type: 'triage_vital_analysis',
        status: AgentTaskStatus.COMPLETED,
        input_data: { heartRate: 134, altitudeM: 3400 },
        output_data: {
          summary: 'Suspected High Altitude Pulmonary/Cerebral Edema onset (HAPE/HACE). Immediate descent mandatory.',
          urgency: 'HIGH',
          fieldRecommendations: 'Descend immediately by at least 500 vertical meters. Administer oxygen if available.',
          isSimulated: true
        },
        is_demo: true,
        created_at: '2026-11-20T08:05:22Z'
      }
    ],
    notifications: [
      {
        id: 'notif-303',
        incident_id: 'inc-002',
        contact_id: 'c-2',
        channel: NotificationChannel.SMS,
        recipient: '+919876543299',
        status: NotificationStatus.DELIVERED,
        provider_reference: 'DEMO-REF-303-SMS',
        error_message: '[DEMO] Notification simulated. Real outbound dispatches suppressed in Demo Mode.',
        is_demo: true,
        retry_count: 0,
        created_at: '2026-11-20T08:05:30Z'
      }
    ]
  },
  {
    id: 'inc-003',
    user_id: 'u-104',
    session_id: 'sess-204',
    incident_type: IncidentType.MANUAL_SOS,
    latitude: 32.3255,
    longitude: 77.1512,
    last_known_location_at: '2026-11-20T05:20:00Z',
    priority: IncidentPriority.MEDIUM,
    status: IncidentStatus.RESOLVED,
    detection_source: DetectionSource.MANUAL,
    is_demo: true,
    created_at: '2026-11-20T05:20:10Z',
    synced_at: '2026-11-20T05:20:15Z',
    profile: SEEDED_PROFILES[3],
    hiking_session: SEEDED_SESSIONS[3],
    triage_assessment: {
      id: 'tri-003',
      incident_id: 'inc-003',
      consciousness_status: 'fully_alert',
      breathing_difficulty: false,
      bleeding_status: 'none',
      injury_location: 'None (lost trail in whiteout fog)',
      mobility_status: 'mobile',
      pain_level: 2,
      assessment_summary: 'Hiker lost trail marker during sudden blizzard whiteout near Beas Kund. Shelter reached safely.',
      created_at: '2026-11-20T05:20:40Z'
    },
    vital_readings: [
      {
        id: 'vit-004',
        incident_id: 'inc-003',
        heart_rate_estimate: 88,
        signal_quality: 0.96,
        measurement_duration: 30,
        is_demo: true,
        recorded_at: '2026-11-20T05:21:00Z'
      }
    ],
    agent_tasks: [],
    notifications: [
      {
        id: 'notif-304',
        incident_id: 'inc-003',
        contact_id: 'c-3',
        channel: NotificationChannel.SMS,
        recipient: '+919876543288',
        status: NotificationStatus.DELIVERED,
        provider_reference: 'DEMO-REF-304-RESOLVED',
        error_message: '[DEMO] Notification simulated. Real outbound dispatches suppressed in Demo Mode.',
        is_demo: true,
        retry_count: 0,
        created_at: '2026-11-20T05:20:25Z'
      }
    ]
  }
];
