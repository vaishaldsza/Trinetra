import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import {
  EmergencyContact,
  HikingSession,
  Incident,
  Profile,
  LocationHistory,
  TriageAssessment,
  VitalReading,
  HikingSessionStatus,
  IncidentPriority,
  IncidentStatus,
  IncidentType,
  DetectionSource,
  UserRole,
  EmergencyContactSchema,
  ProfileSchema
} from '@trinetra/shared';
import {
  getDb,
  saveLocalProfile,
  getLocalProfile,
  saveLocalContact,
  deleteLocalContact,
  getLocalContacts,
  saveLocalSession,
  getLocalSessions,
  saveLocalIncident,
  getLocalIncidents,
  saveLocalLocationPoint,
  saveLocalTriage,
  enqueueSync,
  getSyncStatusCounts,
  SyncStatusCounts
} from '../lib/db';
import { processSyncQueue } from '../lib/sync';
import { fallDetector } from '../lib/fallDetector';
import { FALL_DETECTION_CONFIG } from '../config/fallDetection';
import { TriageInput, evaluateTriageRules, localTriageAssistant } from '../lib/triageEngine';

interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  recorded_at: string;
}

interface SafetyState {
  profile: Profile;
  contacts: EmergencyContact[];
  activeSession: HikingSession | null;
  activeIncident: Incident | null;
  pastSessions: HikingSession[];
  syncCounts: SyncStatusCounts;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  sessionElapsedSeconds: number;
  lastKnownLocation: LocationCoords | null;
  locationPermissionGranted: boolean | null;
  locationWatcherSubscription: Location.LocationSubscription | null;

  // Fall Detection State
  isFallDetectionActive: boolean;
  fallCountdownSeconds: number | null;
  showFallAlertModal: boolean;

  // Actions
  initStore: () => Promise<void>;
  updateProfile: (fullName: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  addContact: (name: string, phone: string, relationship: string, priority?: number) => Promise<{ success: boolean; error?: string }>;
  removeContact: (id: string) => Promise<void>;
  startSession: (trailName?: string) => Promise<HikingSession>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  triggerSOS: (
    detectionSource?: DetectionSource,
    incidentType?: IncidentType
  ) => Promise<Incident>;
  cancelSOS: (incidentId: string) => Promise<void>;
  syncNow: () => Promise<void>;
  incrementElapsed: () => void;
  checkNetworkAndSync: () => Promise<void>;

  // Fall Detection Actions
  onFallDetected: () => void;
  confirmFallSOS: () => Promise<void>;
  dismissFallAlert: () => void;
  simulateFallEvent: () => void;
  decrementFallCountdown: () => void;

  // Triage & Vitals
  submitTriage: (input: TriageInput) => Promise<TriageAssessment>;
  recordVitalReading: (bpm: number, quality: number) => Promise<VitalReading>;
}

const DEFAULT_USER_ID = 'a0000000-0000-0000-0000-000000000001';

export const useSafetyStore = create<SafetyState>((set, get) => ({
  profile: {
    id: DEFAULT_USER_ID,
    full_name: 'Arjun Sharma (Demo Hiker)',
    email: 'hiker.demo@trinetra.safety',
    phone: '+919876543210',
    role: UserRole.USER
  },
  contacts: [],
  activeSession: null,
  activeIncident: null,
  pastSessions: [],
  syncCounts: { pending: 0, synced: 0, failed: 0 },
  isSyncing: false,
  lastSyncedAt: null,
  sessionElapsedSeconds: 0,
  lastKnownLocation: null,
  locationPermissionGranted: null,
  locationWatcherSubscription: null,

  isFallDetectionActive: false,
  fallCountdownSeconds: null,
  showFallAlertModal: false,

  initStore: async () => {
    await getDb();
    const userId = get().profile.id;

    // Load profile
    const existingProfile = await getLocalProfile(userId);
    if (existingProfile) {
      set({ profile: existingProfile });
    } else {
      await saveLocalProfile(get().profile);
    }

    // Load contacts
    let contacts = await getLocalContacts(userId);
    if (contacts.length === 0) {
      const defaultContact: EmergencyContact = {
        id: 'b0000000-0000-0000-0000-000000000001',
        user_id: userId,
        contact_name: 'Vikram Sharma (Brother)',
        phone_number: '+919876543219',
        relationship: 'Sibling',
        priority: 1,
        created_at: new Date().toISOString()
      };
      await saveLocalContact(defaultContact);
      contacts = [defaultContact];
    }

    // Load sessions
    const sessions = await getLocalSessions(userId);
    const active = sessions.find(
      s => s.status === HikingSessionStatus.ACTIVE || s.status === HikingSessionStatus.EMERGENCY_ACTIVE
    ) || null;

    // Load incidents
    const incidents = await getLocalIncidents(userId);
    const activeInc = incidents.find(
      i => i.status === IncidentStatus.DETECTED ||
           i.status === IncidentStatus.EMERGENCY_INITIATED ||
           i.status === IncidentStatus.ASSISTANCE_REQUESTED
    ) || null;

    const counts = await getSyncStatusCounts();

    set({
      contacts,
      activeSession: active,
      activeIncident: activeInc,
      pastSessions: sessions.filter(s => s.status === HikingSessionStatus.COMPLETED),
      syncCounts: counts
    });

    // If an active session was restored, restart fall detection
    if (active && active.status === HikingSessionStatus.ACTIVE) {
      fallDetector.start(() => get().onFallDetected());
      set({ isFallDetectionActive: true });
    }

    get().checkNetworkAndSync();
  },

  checkNetworkAndSync: async () => {
    try {
      const network = await Network.getNetworkStateAsync();
      if (network.isConnected && network.isInternetReachable) {
        await get().syncNow();
      }
    } catch {
      // Ignore network checking errors
    }
  },

  updateProfile: async (fullName: string, phone: string) => {
    const current = get().profile;
    const candidate = {
      full_name: fullName,
      email: current.email,
      phone: phone.trim() ? phone.trim() : null
    };

    const validation = ProfileSchema.pick({ full_name: true, email: true, phone: true }).safeParse(candidate);
    if (!validation.success) {
      const errorMsg = validation.error.errors[0]?.message || 'Invalid profile information';
      return { success: false, error: errorMsg };
    }

    const updated: Profile = {
      ...current,
      full_name: fullName,
      phone: candidate.phone,
      updated_at: new Date().toISOString()
    };

    await saveLocalProfile(updated);
    await enqueueSync(Crypto.randomUUID(), 'profiles', 'update', updated.id, updated as unknown as Record<string, unknown>);
    const counts = await getSyncStatusCounts();
    set({ profile: updated, syncCounts: counts });
    return { success: true };
  },

  addContact: async (name: string, phone: string, relationship: string, priority = 1) => {
    const userId = get().profile.id;
    const candidate = {
      contact_name: name,
      phone_number: phone.trim(),
      relationship,
      priority
    };

    const validation = EmergencyContactSchema.pick({
      contact_name: true,
      phone_number: true,
      relationship: true,
      priority: true
    }).safeParse(candidate);

    if (!validation.success) {
      const errorMsg = validation.error.errors[0]?.message || 'Invalid contact format';
      return { success: false, error: errorMsg };
    }

    const newContact: EmergencyContact = {
      id: Crypto.randomUUID(),
      user_id: userId,
      contact_name: name,
      phone_number: phone.trim(),
      relationship,
      priority,
      created_at: new Date().toISOString()
    };

    await saveLocalContact(newContact);
    await enqueueSync(Crypto.randomUUID(), 'emergency_contacts', 'insert', newContact.id, newContact as unknown as Record<string, unknown>);
    const contacts = await getLocalContacts(userId);
    const counts = await getSyncStatusCounts();
    set({ contacts, syncCounts: counts });
    return { success: true };
  },

  removeContact: async (id: string) => {
    const userId = get().profile.id;
    await deleteLocalContact(id);
    await enqueueSync(Crypto.randomUUID(), 'emergency_contacts', 'delete', id, { id });
    const contacts = await getLocalContacts(userId);
    const counts = await getSyncStatusCounts();
    set({ contacts, syncCounts: counts });
  },

  startSession: async (trailName = 'Rohtang Pass Ridge') => {
    const userId = get().profile.id;
    const now = new Date().toISOString();

    // 1. Request GPS Permission
    let coords: LocationCoords | null = null;
    let sub: Location.LocationSubscription | null = null;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      set({ locationPermissionGranted: granted });

      if (granted) {
        const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        coords = {
          latitude: initial.coords.latitude,
          longitude: initial.coords.longitude,
          accuracy: initial.coords.accuracy ?? undefined,
          recorded_at: now
        };
        set({ lastKnownLocation: coords });

        sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 15000,
            distanceInterval: 10
          },
          async (loc) => {
            const currentSession = get().activeSession;
            if (!currentSession) return;
            const pt: LocationHistory = {
              id: Crypto.randomUUID(),
              session_id: currentSession.id,
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              accuracy: loc.coords.accuracy ?? undefined,
              recorded_at: new Date().toISOString()
            };
            await saveLocalLocationPoint(pt);
            await enqueueSync(Crypto.randomUUID(), 'location_history', 'insert', pt.id, pt as unknown as Record<string, unknown>);
            set({
              lastKnownLocation: {
                latitude: pt.latitude,
                longitude: pt.longitude,
                accuracy: pt.accuracy,
                recorded_at: pt.recorded_at
              }
            });
          }
        );
      }
    } catch {
      set({ locationPermissionGranted: false });
    }

    const session: HikingSession = {
      id: Crypto.randomUUID(),
      user_id: userId,
      start_time: now,
      status: HikingSessionStatus.ACTIVE,
      start_location: {
        trail: trailName,
        latitude: coords?.latitude || 32.3716,
        longitude: coords?.longitude || 77.2466
      },
      created_at: now
    };

    await saveLocalSession(session);
    await enqueueSync(Crypto.randomUUID(), 'hiking_sessions', 'insert', session.id, session as unknown as Record<string, unknown>);
    const counts = await getSyncStatusCounts();

    // Start fall detection sensors strictly during active session
    await fallDetector.start(() => get().onFallDetected());

    set({
      activeSession: session,
      sessionElapsedSeconds: 0,
      syncCounts: counts,
      locationWatcherSubscription: sub,
      isFallDetectionActive: true
    });

    return session;
  },

  pauseSession: async () => {
    const session = get().activeSession;
    if (!session) return;
    fallDetector.stop();
    const updated: HikingSession = { ...session, status: HikingSessionStatus.PAUSED };
    await saveLocalSession(updated);
    await enqueueSync(Crypto.randomUUID(), 'hiking_sessions', 'update', updated.id, updated as unknown as Record<string, unknown>);
    const counts = await getSyncStatusCounts();
    set({ activeSession: updated, syncCounts: counts, isFallDetectionActive: false });
  },

  resumeSession: async () => {
    const session = get().activeSession;
    if (!session) return;
    await fallDetector.start(() => get().onFallDetected());
    const updated: HikingSession = { ...session, status: HikingSessionStatus.ACTIVE };
    await saveLocalSession(updated);
    await enqueueSync(Crypto.randomUUID(), 'hiking_sessions', 'update', updated.id, updated as unknown as Record<string, unknown>);
    const counts = await getSyncStatusCounts();
    set({ activeSession: updated, syncCounts: counts, isFallDetectionActive: true });
  },

  stopSession: async () => {
    const session = get().activeSession;
    if (!session) return;

    // Stop and unhook all sensors to prevent battery drain
    fallDetector.stop();
    const sub = get().locationWatcherSubscription;
    if (sub) {
      sub.remove();
    }

    const updated: HikingSession = {
      ...session,
      status: HikingSessionStatus.COMPLETED,
      end_time: new Date().toISOString()
    };
    await saveLocalSession(updated);
    await enqueueSync(Crypto.randomUUID(), 'hiking_sessions', 'update', updated.id, updated as unknown as Record<string, unknown>);
    const userId = get().profile.id;
    const past = await getLocalSessions(userId);
    const counts = await getSyncStatusCounts();

    set({
      activeSession: null,
      pastSessions: past.filter(s => s.status === HikingSessionStatus.COMPLETED),
      sessionElapsedSeconds: 0,
      syncCounts: counts,
      locationWatcherSubscription: null,
      isFallDetectionActive: false,
      showFallAlertModal: false,
      fallCountdownSeconds: null
    });
  },

  // Reusable SOS Creation Path (Reused by manual SOS and fall detection)
  triggerSOS: async (
    detectionSource: DetectionSource = DetectionSource.MANUAL,
    incidentType: IncidentType = IncidentType.MANUAL_SOS
  ) => {
    const userId = get().profile.id;
    const session = get().activeSession;
    const lastLoc = get().lastKnownLocation;

    const incidentId = Crypto.randomUUID();
    const now = new Date().toISOString();

    const incident: Incident = {
      id: incidentId,
      user_id: userId,
      session_id: session?.id,
      incident_type: incidentType,
      latitude: lastLoc?.latitude ?? 32.3716,
      longitude: lastLoc?.longitude ?? 77.2466,
      last_known_location_at: lastLoc?.recorded_at || now,
      priority: IncidentPriority.CRITICAL,
      status: IncidentStatus.EMERGENCY_INITIATED,
      detection_source: detectionSource,
      is_demo: true,
      created_at: now
    };

    // Save locally to SQLite immediately (Critical emergency never waits on cloud/AI)
    await saveLocalIncident(incident);

    if (session) {
      const updatedSession: HikingSession = {
        ...session,
        status: HikingSessionStatus.EMERGENCY_ACTIVE
      };
      await saveLocalSession(updatedSession);
      await enqueueSync(Crypto.randomUUID(), 'hiking_sessions', 'update', updatedSession.id, updatedSession as unknown as Record<string, unknown>);
    }

    await enqueueSync(Crypto.randomUUID(), 'incidents', 'insert', incident.id, incident as unknown as Record<string, unknown>);
    const counts = await getSyncStatusCounts();

    set({
      activeIncident: incident,
      syncCounts: counts,
      showFallAlertModal: false,
      fallCountdownSeconds: null
    });
    return incident;
  },

  cancelSOS: async (incidentId: string) => {
    const incident = get().activeIncident;
    if (!incident || incident.id !== incidentId) return;

    const cancelled: Incident = {
      ...incident,
      status: IncidentStatus.CANCELLED
    };
    await saveLocalIncident(cancelled);
    await enqueueSync(Crypto.randomUUID(), 'incidents', 'update', cancelled.id, cancelled as unknown as Record<string, unknown>);

    const session = get().activeSession;
    if (session && session.status === HikingSessionStatus.EMERGENCY_ACTIVE) {
      const reverted: HikingSession = { ...session, status: HikingSessionStatus.ACTIVE };
      await saveLocalSession(reverted);
      await enqueueSync(Crypto.randomUUID(), 'hiking_sessions', 'update', reverted.id, reverted as unknown as Record<string, unknown>);
      set({ activeSession: reverted });
    }

    const counts = await getSyncStatusCounts();
    set({ activeIncident: null, syncCounts: counts });
  },

  // Fall Detection Handling
  onFallDetected: () => {
    // Only proceed if session active and not already handling an alert
    if (get().showFallAlertModal || get().activeIncident) return;
    set({
      showFallAlertModal: true,
      fallCountdownSeconds: FALL_DETECTION_CONFIG.CONFIRMATION_COUNTDOWN_SECONDS
    });
  },

  confirmFallSOS: async () => {
    // Reuses the existing SOS creation path, setting detection_source = fall
    await get().triggerSOS(DetectionSource.ACCELEROMETER, IncidentType.FALL_DETECTED);
  },

  dismissFallAlert: () => {
    set({
      showFallAlertModal: false,
      fallCountdownSeconds: null
    });
  },

  simulateFallEvent: () => {
    get().onFallDetected();
  },

  decrementFallCountdown: () => {
    const current = get().fallCountdownSeconds;
    if (current === null) return;
    if (current <= 1) {
      // Countdown expired: automatically escalate to emergency assistance
      get().confirmFallSOS();
    } else {
      set({ fallCountdownSeconds: current - 1 });
    }
  },

  // Triage Submission
  submitTriage: async (input: TriageInput): Promise<TriageAssessment> => {
    const incident = get().activeIncident;
    const ruleEvaluation = evaluateTriageRules(input);
    const summary = await localTriageAssistant.generateStructuredSummary(input);

    const triageRecord: TriageAssessment = {
      id: Crypto.randomUUID(),
      incident_id: incident?.id || 'd0000000-0000-0000-0000-000000000001',
      consciousness_status: input.consciousness,
      breathing_difficulty: input.breathingDifficulty,
      bleeding_status: input.bleeding,
      injury_location: input.injuryLocation,
      mobility_status: input.mobility,
      pain_level: input.painLevel,
      assessment_summary: summary,
      created_at: new Date().toISOString()
    };

    // Save to local SQLite
    await saveLocalTriage({
      ...triageRecord,
      created_at: triageRecord.created_at || new Date().toISOString()
    });

    // Update incident priority if triage indicates critical or higher
    if (incident) {
      const updatedIncident: Incident = {
        ...incident,
        priority: ruleEvaluation.priority
      };
      await saveLocalIncident(updatedIncident);
      set({ activeIncident: updatedIncident });
    }

    await enqueueSync(Crypto.randomUUID(), 'triage_assessments', 'insert', triageRecord.id, triageRecord as unknown as Record<string, unknown>);
    const counts = await getSyncStatusCounts();
    set({ syncCounts: counts });

    return triageRecord;
  },

  // Vitals Recording (Camera PPG non-diagnostic)
  recordVitalReading: async (bpm: number, quality: number): Promise<VitalReading> => {
    const incident = get().activeIncident;
    const reading: VitalReading = {
      id: Crypto.randomUUID(),
      incident_id: incident?.id || 'd0000000-0000-0000-0000-000000000001',
      heart_rate_estimate: bpm,
      signal_quality: quality,
      measurement_duration: 30.0,
      recorded_at: new Date().toISOString()
    };

    await enqueueSync(Crypto.randomUUID(), 'vital_readings', 'insert', reading.id, reading as unknown as Record<string, unknown>);
    const counts = await getSyncStatusCounts();
    set({ syncCounts: counts });

    return reading;
  },

  syncNow: async () => {
    set({ isSyncing: true });
    try {
      const result = await processSyncQueue();
      set({
        syncCounts: result.counts,
        lastSyncedAt: new Date().toLocaleTimeString()
      });
    } finally {
      set({ isSyncing: false });
    }
  },

  incrementElapsed: () => {
    set(state => ({ sessionElapsedSeconds: state.sessionElapsedSeconds + 1 }));
  }
}));
