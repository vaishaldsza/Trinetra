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
  enqueueSync,
  getSyncStatusCounts,
  SyncStatusCounts
} from '../lib/db';
import { processSyncQueue } from '../lib/sync';

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

  // Actions
  initStore: () => Promise<void>;
  updateProfile: (fullName: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  addContact: (name: string, phone: string, relationship: string, priority?: number) => Promise<{ success: boolean; error?: string }>;
  removeContact: (id: string) => Promise<void>;
  startSession: (trailName?: string) => Promise<HikingSession>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  triggerSOS: () => Promise<Incident>;
  cancelSOS: (incidentId: string) => Promise<void>;
  syncNow: () => Promise<void>;
  incrementElapsed: () => void;
  checkNetworkAndSync: () => Promise<void>;
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

    // Check network and trigger sync if connected
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

    // Zod validation with shared schema
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

    // Zod validation with shared schema (validates E.164 phone)
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

    // 1. Request GPS Permission with graceful denial
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
          accuracy: initial.coords.accuracy || undefined,
          recorded_at: now
        };
        set({ lastKnownLocation: coords });

        // Start location watcher: 15s interval or 10m distance
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
              accuracy: loc.coords.accuracy || undefined,
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

    set({
      activeSession: session,
      sessionElapsedSeconds: 0,
      syncCounts: counts,
      locationWatcherSubscription: sub
    });

    return session;
  },

  pauseSession: async () => {
    const session = get().activeSession;
    if (!session) return;
    const updated: HikingSession = { ...session, status: HikingSessionStatus.PAUSED };
    await saveLocalSession(updated);
    await enqueueSync(Crypto.randomUUID(), 'hiking_sessions', 'update', updated.id, updated as unknown as Record<string, unknown>);
    const counts = await getSyncStatusCounts();
    set({ activeSession: updated, syncCounts: counts });
  },

  resumeSession: async () => {
    const session = get().activeSession;
    if (!session) return;
    const updated: HikingSession = { ...session, status: HikingSessionStatus.ACTIVE };
    await saveLocalSession(updated);
    await enqueueSync(Crypto.randomUUID(), 'hiking_sessions', 'update', updated.id, updated as unknown as Record<string, unknown>);
    const counts = await getSyncStatusCounts();
    set({ activeSession: updated, syncCounts: counts });
  },

  stopSession: async () => {
    const session = get().activeSession;
    if (!session) return;

    // Unsubscribe location watcher
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
      locationWatcherSubscription: null
    });
  },

  triggerSOS: async () => {
    const userId = get().profile.id;
    const session = get().activeSession;
    const lastLoc = get().lastKnownLocation;

    // Idempotent client-generated UUID
    const incidentId = Crypto.randomUUID();
    const now = new Date().toISOString();

    // Attach last-known GPS location to the incident
    const incident: Incident = {
      id: incidentId,
      user_id: userId,
      session_id: session?.id,
      incident_type: IncidentType.MANUAL_SOS,
      latitude: lastLoc?.latitude ?? 32.3716,
      longitude: lastLoc?.longitude ?? 77.2466,
      last_known_location_at: lastLoc?.recorded_at || now,
      priority: IncidentPriority.CRITICAL,
      status: IncidentStatus.EMERGENCY_INITIATED,
      detection_source: DetectionSource.MANUAL,
      is_demo: true,
      created_at: now
    };

    // Save to local SQLite immediately
    await saveLocalIncident(incident);

    // Update active session to emergency active
    if (session) {
      const updatedSession: HikingSession = {
        ...session,
        status: HikingSessionStatus.EMERGENCY_ACTIVE
      };
      await saveLocalSession(updatedSession);
      await enqueueSync(Crypto.randomUUID(), 'hiking_sessions', 'update', updatedSession.id, updatedSession as unknown as Record<string, unknown>);
    }

    // Enqueue incident for background sync
    await enqueueSync(Crypto.randomUUID(), 'incidents', 'insert', incident.id, incident as unknown as Record<string, unknown>);
    const counts = await getSyncStatusCounts();

    set({ activeIncident: incident, syncCounts: counts });
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
