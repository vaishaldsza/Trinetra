import { describe, it, expect, vi } from 'vitest';
import {
  AgentName,
  AgentTaskStatus,
  Incident,
  IncidentPriority,
  IncidentStatus,
  IncidentType,
  DetectionSource,
  Notification,
  NotificationChannel,
  NotificationStatus,
  EmergencyContact
} from '@trinetra/shared';
import { processIncidentLogic } from '../../../../supabase/functions/_shared/services/incidentProcessor';
import { sendNotificationLogic } from '../../../../supabase/functions/_shared/services/notificationService';
import { OverpassHospitalClient } from '../../../../supabase/functions/_shared/services/agentRunner';
import { DatabaseClient, TwilioClient, ElevenLabsClient } from '../../../../supabase/functions/_shared/types';

function createMockDb(initial: {
  incident?: Incident;
  contacts?: EmergencyContact[];
  notification?: Notification;
}): DatabaseClient {
  const incident = initial.incident || {
    id: 'inc-100',
    user_id: 'user-1',
    incident_type: IncidentType.MANUAL_SOS,
    latitude: 32.24,
    longitude: 77.18,
    priority: IncidentPriority.CRITICAL,
    status: IncidentStatus.EMERGENCY_INITIATED,
    detection_source: DetectionSource.MANUAL,
    is_demo: true,
    created_at: new Date().toISOString()
  };

  const contacts = initial.contacts || [];
  const notifications = new Map<string, Notification>();
  if (initial.notification) {
    notifications.set(initial.notification.id, initial.notification);
  }

  const agentTasks = new Map<string, any>();

  return {
    async getIncident(id: string) {
      return id === incident.id ? incident : null;
    },
    async getEmergencyContacts(userId: string) {
      return contacts.filter(c => c.user_id === userId);
    },
    async createAgentTask(task) {
      const id = task.id || `task-${agentTasks.size + 1}`;
      const created = { ...task, id };
      agentTasks.set(id, created);
      return created;
    },
    async getAgentTask(id: string) {
      return agentTasks.get(id) || null;
    },
    async updateAgentTask(id: string, updates) {
      const existing = agentTasks.get(id);
      if (existing) agentTasks.set(id, { ...existing, ...updates });
    },
    async createNotification(notif) {
      const id = notif.id || `notif-${notifications.size + 1}`;
      const created: Notification = {
        id,
        incident_id: notif.incident_id,
        contact_id: notif.contact_id,
        channel: notif.channel,
        recipient: notif.recipient,
        status: notif.status,
        is_demo: notif.is_demo ?? false,
        created_at: notif.created_at || new Date().toISOString(),
        updated_at: notif.updated_at || new Date().toISOString(),
        provider_reference: notif.provider_reference,
        error_message: notif.error_message
      };
      notifications.set(id, created);
      return created;
    },
    async getNotification(id: string) {
      return notifications.get(id) || null;
    },
    async updateNotification(id: string, updates) {
      const existing = notifications.get(id);
      if (existing) notifications.set(id, { ...existing, ...updates });
    },
    async getTriageAssessment() {
      return null;
    },
    async getVitalReadings() {
      return [];
    }
  };
}

describe('Emergency Intelligence (Backend Services)', () => {
  it('DEMO GUARD: Never calls Twilio or ElevenLabs when incident.is_demo is true', async () => {
    const demoIncident: Incident = {
      id: 'demo-inc-1',
      user_id: 'user-1',
      incident_type: IncidentType.FALL_DETECTED,
      priority: IncidentPriority.CRITICAL,
      status: IncidentStatus.EMERGENCY_INITIATED,
      detection_source: DetectionSource.ACCELEROMETER,
      is_demo: true, // DEMO MODE ACTIVE
      created_at: new Date().toISOString()
    };

    const notification: Notification = {
      id: 'notif-1',
      incident_id: demoIncident.id,
      contact_id: 'contact-1',
      channel: NotificationChannel.SMS,
      recipient: '+919876543210',
      status: NotificationStatus.PENDING,
      is_demo: true,
      created_at: new Date().toISOString()
    };

    const db = createMockDb({ incident: demoIncident, notification });

    const twilioSendSms = vi.fn();
    const twilioMakeVoiceCall = vi.fn();
    const mockTwilio: TwilioClient = {
      isConfigured: () => true,
      sendSms: twilioSendSms,
      makeVoiceCall: twilioMakeVoiceCall
    };

    const elevenLabsSynthesize = vi.fn();
    const mockElevenLabs: ElevenLabsClient = {
      isConfigured: () => true,
      synthesizeSpeech: elevenLabsSynthesize
    };

    const result = await sendNotificationLogic(notification.id, {
      db,
      twilio: mockTwilio,
      elevenLabs: mockElevenLabs
    });

    // Verify external telephony APIs were NEVER touched
    expect(twilioSendSms).not.toHaveBeenCalled();
    expect(twilioMakeVoiceCall).not.toHaveBeenCalled();
    expect(elevenLabsSynthesize).not.toHaveBeenCalled();

    // Verify notification was marked simulated and delivered
    expect(result.status).toBe(NotificationStatus.DELIVERED);
    expect(result.errorMessage).toContain('[DEMO]');
    expect(result.providerReference).toContain('DEMO-REF');

    const updatedNotif = await db.getNotification(notification.id);
    expect(updatedNotif?.status).toBe(NotificationStatus.DELIVERED);
  });

  it('CONSENT FILTERING: Notifies only contacts with consent = true and creates all five agent tasks', async () => {
    const incident: Incident = {
      id: 'incident-multi-contact',
      user_id: 'user-1',
      incident_type: IncidentType.MANUAL_SOS,
      priority: IncidentPriority.HIGH,
      status: IncidentStatus.EMERGENCY_INITIATED,
      detection_source: DetectionSource.MANUAL,
      is_demo: true,
      created_at: new Date().toISOString()
    };

    const contacts: EmergencyContact[] = [
      {
        id: 'contact-consented-1',
        user_id: 'user-1',
        contact_name: 'Priya Sharma',
        phone_number: '+919876543210',
        relationship: 'Spouse',
        priority: 1,
        consent: true, // CONSENTED
        created_at: new Date().toISOString()
      },
      {
        id: 'contact-unconsented',
        user_id: 'user-1',
        contact_name: 'Rohan Verma',
        phone_number: '+919876543211',
        relationship: 'Colleague',
        priority: 2,
        consent: false, // NO CONSENT
        created_at: new Date().toISOString()
      },
      {
        id: 'contact-consented-2',
        user_id: 'user-1',
        contact_name: 'Deepak Patel',
        phone_number: '+919876543212',
        relationship: 'Sibling',
        priority: 3,
        consent: true, // CONSENTED
        created_at: new Date().toISOString()
      }
    ];

    const db = createMockDb({ incident, contacts });
    const runAgentTask = vi.fn().mockResolvedValue(undefined);
    const sendNotification = vi.fn().mockResolvedValue(undefined);

    const result = await processIncidentLogic(incident.id, {
      db,
      runAgentTask,
      sendNotification
    });

    // 1. Five multi-agent tasks must be created
    expect(result.agentTasksCreated).toHaveLength(5);
    const agentNames = result.agentTasksCreated.map(t => t.agent_name);
    expect(agentNames).toContain(AgentName.LOCATION_INTELLIGENCE);
    expect(agentNames).toContain(AgentName.MEDICAL_INTELLIGENCE);
    expect(agentNames).toContain(AgentName.ROUTE_INTELLIGENCE);
    expect(agentNames).toContain(AgentName.EMERGENCY_COORDINATION);
    expect(agentNames).toContain(AgentName.COMMUNICATION);

    // 2. Only consented contacts receive notifications
    expect(result.consentedContactsCount).toBe(2);
    expect(result.unconsentedContactsCount).toBe(1);
    expect(result.notificationsCreated).toHaveLength(2);

    const recipients = result.notificationsCreated.map(n => n.recipient);
    expect(recipients).toContain('+919876543210');
    expect(recipients).toContain('+919876543212');
    expect(recipients).not.toContain('+919876543211'); // Unconsented must never receive notification
  });

  it('MISSING KEYS: Marks row "skipped: not configured" when credentials are unset', async () => {
    const liveIncident: Incident = {
      id: 'live-inc-real',
      user_id: 'user-real',
      incident_type: IncidentType.MANUAL_SOS,
      priority: IncidentPriority.HIGH,
      status: IncidentStatus.EMERGENCY_INITIATED,
      detection_source: DetectionSource.MANUAL,
      is_demo: false, // Live production incident
      created_at: new Date().toISOString()
    };

    const notification: Notification = {
      id: 'notif-live-1',
      incident_id: liveIncident.id,
      contact_id: 'contact-1',
      channel: NotificationChannel.SMS,
      recipient: '+919876543210',
      status: NotificationStatus.PENDING,
      is_demo: false,
      created_at: new Date().toISOString()
    };

    const db = createMockDb({ incident: liveIncident, notification });

    const mockUnconfiguredTwilio: TwilioClient = {
      isConfigured: () => false, // KEYS UNCONFIGURED
      sendSms: vi.fn(),
      makeVoiceCall: vi.fn()
    };

    const mockUnconfiguredElevenLabs: ElevenLabsClient = {
      isConfigured: () => false,
      synthesizeSpeech: vi.fn()
    };

    const result = await sendNotificationLogic(notification.id, {
      db,
      twilio: mockUnconfiguredTwilio,
      elevenLabs: mockUnconfiguredElevenLabs
    });

    expect(result.status).toBe(NotificationStatus.FAILED);
    expect(result.errorMessage).toBe('skipped: not configured');

    const updatedNotif = await db.getNotification(notification.id);
    expect(updatedNotif?.status).toBe(NotificationStatus.FAILED);
    expect(updatedNotif?.error_message).toBe('skipped: not configured');
  });

  it('OVERPASS API: Gracefully handles timeouts and falls back to cached emergency medical facilities', async () => {
    // Overpass client pointing to non-existent endpoint with 50ms timeout to force abort/failure
    const overpass = new OverpassHospitalClient('http://127.0.0.1:54321/timeout-test', 50);

    const hospitals = await overpass.findNearbyHospitals(32.24, 77.18, 25000);

    expect(hospitals).toBeDefined();
    expect(hospitals.length).toBeGreaterThan(0);
    // Verified fallback cache was activated without throwing unhandled exceptions
    expect(hospitals[0].name).toContain('[FALLBACK CACHE]');
    expect(hospitals[0].distanceKm).toBeGreaterThan(0);
  });
});
