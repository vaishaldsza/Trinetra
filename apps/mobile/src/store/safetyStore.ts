import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import {
  EmergencyContact,
  HikingSession,
  Incident,
  Profile,
  HikingSessionStatus,
  IncidentPriority,
  IncidentStatus,
  IncidentType,
  DetectionSource,
  UserRole
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
  enqueueSync,
  getPendingCount
} from '../lib/db';
import { processSyncQueue } from '../lib/sync';

interface SafetyState {
  profile: Profile;
  contacts: EmergencyContact[];
  activeSession: HikingSession | null;
  activeIncident: Incident | null;
  pastSessions: HikingSession[];
  pendingSyncCount: number;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  sessionElapsedSeconds: number;

  // Actions
  initStore: () => Promise<void>;
  updateProfile: (fullName: string, phone: string) => Promise<void>;
  addContact: (name: string, phone: string, relationship: string, priority?: number) => Promise<void>;
  removeContact: (id: string) => Promise<void>;
  startSession: (trailName?: string) => Promise<HikingSession>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  triggerSOS: (coords?: { latitude: number; longitude: number }) => Promise<Incident>;
  cancelSOS: (incidentId: string) => Promise<void>;
  syncNow: () => Promise<void>;
  incrementElapsed: () => void;
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
  pendingSyncCount: 0,
  isSyncing: false,
  lastSyncedAt: null,
  sessionElapsedSeconds: 0,

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
      // Seed default emergency contact locally
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
    const active = sessions.find(s => s.status === HikingSessionStatus.ACTIVE || s.status === HikingSessionStatus.EMERGENCY_ACTIVE) || null;

    // Load incidents
    const incidents = await getLocalIncidents(userId);
    const activeInc = incidents.find(i => i.status === IncidentStatus.DETECTED || i.status === IncidentStatus.EMERGENCY_INITIATED || i.status === IncidentStatus.ASSISTANCE_REQUESTED) || null;

    const pendingCount = await getPendingCount();

    set({
      contacts,
      activeSession: active,
      activeIncident: activeInc,
      pastSessions: sessions.filter(s => s.status === HikingSessionStatus.COMPLETED),
      pendingSyncCount: pendingCount
    });
  },

  updateProfile: async (fullName: string, phone: string) => {
    const current = get().profile;
    const updated: Profile = {
      ...current,
      full_name: fullName,
      phone,
      updated_at: new Date().toISOString()
    };
    await saveLocalProfile(updated);
    await enqueueSync(Crypto.randomUUID(), 'profiles', 'update', updated.id, updated as unknown as Record<string, unknown>);
    const count = await getPendingCount();
    set({ profile: updated, pendingSyncCount: count });
  },

  addContact: async (name: string, phone: string, relationship: string, priority = 1) => {
    const userId = get().profile.id;
    const newContact: EmergencyContact = {
      id: Crypto.randomUUID(),
      user_id: userId,
      contact_name: name,
      phone_number: phone,
      relationship,
      priority,
      created_at: new Date().toISOString()
    };

    await saveLocalContact(newContact);
    await enqueueSync(Crypto.randomUUID(), 'emergency_contacts', 'insert', newContact.id, newContact as unknown as Record<string, unknown>);
    const contacts = await getLocalContacts(userId);
    const count = await getPendingCount();
    set({ contacts, pendingSyncCount: count });
  },

  removeContact: async (id: string) => {
    const userId = get().profile.id;
    await deleteLocalContact(id);
    await enqueueSync(Crypto.randomUUID(), 'emergency_contacts', 'delete', id, { id });
    const contacts = await getLocalContacts(userId);
    const count = await getPendingCount();
    set({ contacts, pendingSyncCount: count });
  },

  startSession: async (trailName = 'Rohtang Pass Ridge') => {
    const userId = get().profile.id;
    const session: HikingSession = {
      id: Crypto.randomUUID(),
      user_id: userId,
      start_time: new Date().toISOString(),
      status: HikingSessionStatus.ACTIVE,
      start_location: { trail: trailName, latitude: 32.3716, longitude: 77.2466 },
      created_at: new Date().toISOString()
    };

    await saveLocalSession(session);
    await enqueueSync(Crypto.randomUUID(), 'hiking_sessions', 'insert', session.id, session as unknown as Record<string, unknown>);
    const count = await getPendingCount();
    set({ activeSession: session, sessionElapsedSeconds: 0, pendingSyncCount: count });
    return session;
  },

  pauseSession: async () => {
    const session = get().activeSession;
    if (!session) return;
    const updated: HikingSession = { ...session, status: HikingSessionStatus.PAUSED };
    await saveLocalSession(updated);
    await enqueueSync(Crypto.randomUUID(), 'hiking_sessions', 'update', updated.id, updated as unknown as Record<string, unknown>);
    const count = await getPendingCount();
    set({ activeSession: updated, pendingSyncCount: count });
  },

  resumeSession: async () => {
    const session = get().activeSession;
    if (!session) return;
    const updated: HikingSession = { ...session, status: HikingSessionStatus.ACTIVE };
    await saveLocalSession(updated);
    await enqueueSync(Crypto.randomUUID(), 'hiking_sessions', 'update', updated.id, updated as unknown as Record<string, unknown>);
    const count = await getPendingCount();
    set({ activeSession: updated, pendingSyncCount: count });
  },

  stopSession: async () => {
    const session = get().activeSession;
    if (!session) return;
    const updated: HikingSession = {
      ...session,
      status: HikingSessionStatus.COMPLETED,
      end_time: new Date().toISOString()
    };
    await saveLocalSession(updated);
    await enqueueSync(Crypto.randomUUID(), 'hiking_sessions', 'update', updated.id, updated as unknown as Record<string, unknown>);
    const userId = get().profile.id;
    const past = await getLocalSessions(userId);
    const count = await getPendingCount();
    set({
      activeSession: null,
      pastSessions: past.filter(s => s.status === HikingSessionStatus.COMPLETED),
      sessionElapsedSeconds: 0,
      pendingSyncCount: count
    });
  },

  triggerSOS: async (coords = { latitude: 32.3716, longitude: 77.2466 }) => {
    const userId = get().profile.id;
    const session = get().activeSession;

    // Idempotent client-generated UUID
    const incidentId = Crypto.randomUUID();
    const now = new Date().toISOString();

    const incident: Incident = {
      id: incidentId,
      user_id: userId,
      session_id: session?.id,
      incident_type: IncidentType.MANUAL_SOS,
      latitude: coords.latitude,
      longitude: coords.longitude,
      last_known_location_at: now,
      priority: IncidentPriority.CRITICAL,
      status: IncidentStatus.EMERGENCY_INITIATED,
      detection_source: DetectionSource.MANUAL,
      is_demo: true,
      created_at: now
    };

    // Save to local SQLite immediately (Critical escalation never waits on network)
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
    const count = await getPendingCount();

    set({ activeIncident: incident, pendingSyncCount: count });
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

    const count = await getPendingCount();
    set({ activeIncident: null, pendingSyncCount: count });
  },

  syncNow: async () => {
    set({ isSyncing: true });
    try {
      const result = await processSyncQueue();
      set({
        pendingSyncCount: result.remaining,
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
