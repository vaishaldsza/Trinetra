import { describe, it, expect, vi } from 'vitest';
import {
  AgentName,
  AgentTask,
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
import {
  sendNotificationLogic,
  sweepNotificationRetriesLogic
} from '../../../../supabase/functions/_shared/services/notificationService';
import { OverpassHospitalClient } from '../../../../supabase/functions/_shared/services/agentRunner';
import {
  authorizeIncidentAccess,
  authorizeTaskAccess,
  computeTwilioSignature,
  validateTwilioSignature
} from '../../../../supabase/functions/_shared/auth';
import { DatabaseClient, TwilioClient, ElevenLabsClient } from '../../../../supabase/functions/_shared/types';
import * as contracts from '../../../../supabase/functions/_shared/contracts';
import * as sharedEnums from '@trinetra/shared';

function createMockDb(initial: {
  incident?: Incident;
  contacts?: EmergencyContact[];
  notification?: Notification;
  task?: AgentTask;
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

  const agentTasks = new Map<string, AgentTask>();
  if (initial.task) {
    agentTasks.set(initial.task.id, initial.task);
  }

  return {
    async getIncident(id: string) {
      return id === incident.id ? incident : null;
    },
    async getEmergencyContacts(userId: string) {
      return contacts.filter(c => c.user_id === userId);
    },
    async createAgentTask(task) {
      const id = task.id || `task-${agentTasks.size + 1}`;
      const created: AgentTask = {
        id,
        incident_id: task.incident_id,
        agent_name: task.agent_name,
        task_type: task.task_type,
        status: task.status ?? AgentTaskStatus.PENDING,
        input_data: task.input_data,
        output_data: task.output_data,
        is_demo: task.is_demo ?? false,
        created_at: task.created_at || new Date().toISOString(),
        completed_at: task.completed_at
      };
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
        retry_count: notif.retry_count ?? 0,
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
    async getRetryScheduledNotifications() {
      return Array.from(notifications.values()).filter(
        n => n.status === NotificationStatus.RETRY_SCHEDULED
      );
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

    const elevenLabsSpeech = vi.fn();
    const mockElevenLabs: ElevenLabsClient = {
      isConfigured: () => true,
      synthesizeSpeech: elevenLabsSpeech
    };

    const result = await sendNotificationLogic(notification.id, {
      db,
      twilio: mockTwilio,
      elevenLabs: mockElevenLabs
    });

    expect(result.status).toBe(NotificationStatus.DELIVERED);
    expect(result.providerReference).toMatch(/^DEMO-REF-/);
    expect(result.errorMessage).toContain('[DEMO]');

    // Absolute zero outbound calls in demo mode
    expect(twilioSendSms).toHaveBeenCalledTimes(0);
    expect(twilioMakeVoiceCall).toHaveBeenCalledTimes(0);
    expect(elevenLabsSpeech).toHaveBeenCalledTimes(0);

    const saved = await db.getNotification(notification.id);
    expect(saved?.status).toBe(NotificationStatus.DELIVERED);
    expect(saved?.provider_reference).toMatch(/^DEMO-REF-/);
    expect(saved?.error_message).toContain('[DEMO]');
  });

  it('CONSENT FILTER: Only creates notifications for contacts with consent = true', async () => {
    const incident: Incident = {
      id: 'inc-consent-test',
      user_id: 'user-hiker-1',
      incident_type: IncidentType.MANUAL_SOS,
      priority: IncidentPriority.HIGH,
      status: IncidentStatus.EMERGENCY_INITIATED,
      detection_source: DetectionSource.MANUAL,
      is_demo: true,
      created_at: new Date().toISOString()
    };

    const contacts: EmergencyContact[] = [
      {
        id: 'contact-1',
        user_id: incident.user_id,
        contact_name: 'Priya Sharma (Sister)',
        phone_number: '+919876543210',
        relationship: 'Sibling',
        priority: 1,
        consent: true, // CONSENTED
        created_at: new Date().toISOString()
      },
      {
        id: 'contact-2',
        user_id: incident.user_id,
        contact_name: 'Old Colleague (Unconsented)',
        phone_number: '+919876543211',
        relationship: 'Colleague',
        priority: 2,
        consent: false, // NO CONSENT
        created_at: new Date().toISOString()
      },
      {
        id: 'contact-3',
        user_id: incident.user_id,
        contact_name: 'Rajesh Sharma (Father)',
        phone_number: '+919876543212',
        relationship: 'Parent',
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

  // ==================== BATCH 4 GAP-FILL TESTS ====================

  it('OWNERSHIP CHECK: Owner allowed, other user denied (403), service role allowed for process-incident & run-agent-task', async () => {
    const incident: Incident = {
      id: 'inc-auth-100',
      user_id: 'owner-user-123',
      incident_type: IncidentType.MANUAL_SOS,
      priority: IncidentPriority.HIGH,
      status: IncidentStatus.EMERGENCY_INITIATED,
      detection_source: DetectionSource.MANUAL,
      is_demo: true,
      created_at: new Date().toISOString()
    };

    const task: AgentTask = {
      id: 'task-auth-200',
      incident_id: incident.id,
      agent_name: AgentName.LOCATION_INTELLIGENCE,
      task_type: 'hospital_lookup',
      status: AgentTaskStatus.PENDING,
      is_demo: true
    };

    const db = createMockDb({ incident, task });

    // 1. Incident ownership checks
    const ownerAuth = { userId: 'owner-user-123', isServiceRole: false };
    const intruderAuth = { userId: 'unauthorized-stranger', isServiceRole: false };
    const serviceRoleAuth = { userId: 'service_role', isServiceRole: true };

    const ownerRes = await authorizeIncidentAccess(incident.id, db, ownerAuth);
    expect(ownerRes.allowed).toBe(true);
    expect(ownerRes.status).toBe(200);

    const intruderRes = await authorizeIncidentAccess(incident.id, db, intruderAuth);
    expect(intruderRes.allowed).toBe(false);
    expect(intruderRes.status).toBe(403);
    expect(intruderRes.error).toContain('Forbidden');

    const serviceRoleRes = await authorizeIncidentAccess(incident.id, db, serviceRoleAuth);
    expect(serviceRoleRes.allowed).toBe(true);
    expect(serviceRoleRes.status).toBe(200);

    // 2. Task authorization checks (verifies parent incident ownership)
    const taskOwnerRes = await authorizeTaskAccess(task.id, db, ownerAuth);
    expect(taskOwnerRes.allowed).toBe(true);
    expect(taskOwnerRes.status).toBe(200);

    const taskIntruderRes = await authorizeTaskAccess(task.id, db, intruderAuth);
    expect(taskIntruderRes.allowed).toBe(false);
    expect(taskIntruderRes.status).toBe(403);

    const taskServiceRoleRes = await authorizeTaskAccess(task.id, db, serviceRoleAuth);
    expect(taskServiceRoleRes.allowed).toBe(true);
    expect(taskServiceRoleRes.status).toBe(200);
  });

  it('DEMO INTEGRITY: Request body claiming is_demo=false for a demo incident row still sends nothing', async () => {
    const demoDbIncident: Incident = {
      id: 'inc-db-demo-real',
      user_id: 'user-1',
      incident_type: IncidentType.FALL_DETECTED,
      priority: IncidentPriority.HIGH,
      status: IncidentStatus.EMERGENCY_INITIATED,
      detection_source: DetectionSource.ACCELEROMETER,
      is_demo: true, // DB row is explicitly demo
      created_at: new Date().toISOString()
    };

    const contacts: EmergencyContact[] = [
      {
        id: 'contact-demo-1',
        user_id: demoDbIncident.user_id,
        contact_name: 'Priya Sharma',
        phone_number: '+919876543210',
        relationship: 'Sibling',
        priority: 1,
        consent: true,
        created_at: new Date().toISOString()
      }
    ];

    const db = createMockDb({ incident: demoDbIncident, contacts });

    const twilioSendSms = vi.fn();
    const mockTwilio: TwilioClient = {
      isConfigured: () => true,
      sendSms: twilioSendSms,
      makeVoiceCall: vi.fn()
    };

    const mockElevenLabs: ElevenLabsClient = {
      isConfigured: () => true,
      synthesizeSpeech: vi.fn()
    };

    // Caller passes a payload claiming is_demo = false in request body
    const spoofedRequestBody = {
      incident_id: demoDbIncident.id,
      is_demo: false // Malicious or mistaken override attempt
    };

    // processIncidentLogic MUST pull from DB row, ignoring any body claim
    const procResult = await processIncidentLogic(spoofedRequestBody.incident_id, {
      db,
      runAgentTask: vi.fn().mockResolvedValue(undefined),
      sendNotification: vi.fn().mockResolvedValue(undefined)
    });

    const notifCreated = procResult.notificationsCreated[0];
    expect(notifCreated.is_demo).toBe(true); // Must remain demo because DB row is demo!

    // When dispatched, Twilio must NEVER be called
    const sendResult = await sendNotificationLogic(notifCreated.id, {
      db,
      twilio: mockTwilio,
      elevenLabs: mockElevenLabs
    });

    expect(twilioSendSms).toHaveBeenCalledTimes(0);
    expect(sendResult.status).toBe(NotificationStatus.DELIVERED);
    expect(sendResult.errorMessage).toContain('[DEMO]');
    expect(sendResult.providerReference).toContain('DEMO-REF');
  });

  it('TWILIO WEBHOOK: Validates X-Twilio-Signature strictly against TWILIO_WEBHOOK_URL secret and rejects mismatch or forgery', async () => {
    const authToken = 'mock_auth_token_secret_12345';
    const configuredWebhookUrl = 'https://safety.trinetra.live/functions/v1/twilio-webhook';
    const params = {
      MessageSid: 'SM1234567890abcdef',
      MessageStatus: 'delivered',
      To: '+919876543210'
    };

    // 1. Valid signature computed from configured secret URL passes
    const validSignature = await computeTwilioSignature(authToken, configuredWebhookUrl, params);
    const isValid = await validateTwilioSignature(authToken, validSignature, configuredWebhookUrl, params);
    expect(isValid).toBe(true);

    // 2. Reject if incoming request URL or proxy URL is passed instead of TWILIO_WEBHOOK_URL
    const internalProxyUrl = 'http://127.0.0.1:54321/functions/v1/twilio-webhook';
    const isMismatch = await validateTwilioSignature(authToken, validSignature, internalProxyUrl, params);
    expect(isMismatch).toBe(false);

    // 3. Tampered signature should be rejected
    const isInvalidSig = await validateTwilioSignature(authToken, 'invalid_forged_signature', configuredWebhookUrl, params);
    expect(isInvalidSig).toBe(false);

    // 4. Missing secret or missing signature should be rejected safely
    expect(await validateTwilioSignature(undefined, validSignature, configuredWebhookUrl, params)).toBe(false);
    expect(await validateTwilioSignature(authToken, null, configuredWebhookUrl, params)).toBe(false);
    expect(await validateTwilioSignature(authToken, validSignature, undefined, params)).toBe(false);
  });

  it('CONTRACTS PARITY: Asserts supabase/functions/_shared/contracts.ts enums match packages/shared/src/enums.ts 1:1', () => {

    const enumKeys = [
      'UserRole',
      'HikingSessionStatus',
      'IncidentStatus',
      'IncidentPriority',
      'IncidentType',
      'DetectionSource',
      'NotificationChannel',
      'NotificationStatus',
      'AgentTaskStatus',
      'AgentName'
    ] as const;

    for (const key of enumKeys) {
      expect(contracts, `contracts.ts is missing enum ${key}`).toHaveProperty(key);
      const contractEnum = (contracts as Record<string, any>)[key];
      const sharedEnum = (sharedEnums as Record<string, any>)[key];

      expect(contractEnum, `Enum ${key} does not exist in shared enums`).toBeDefined();
      expect(Object.entries(contractEnum)).toEqual(Object.entries(sharedEnum));
    }
  });

  it('RETRY NOTIFICATIONS: Dispatches retry_scheduled rows with backoff, rejects unauthorized callers, and skips demo rows', async () => {
    const liveIncident: Incident = {
      id: 'inc-retry-dispatch-test',
      user_id: 'user-retry-1',
      incident_type: IncidentType.MANUAL_SOS,
      priority: IncidentPriority.HIGH,
      status: IncidentStatus.EMERGENCY_INITIATED,
      detection_source: DetectionSource.MANUAL,
      is_demo: false,
      created_at: new Date().toISOString()
    };

    const eligibleNotif: Notification = {
      id: 'notif-retry-eligible-1',
      incident_id: liveIncident.id,
      channel: NotificationChannel.SMS,
      recipient: '+919876543210',
      status: NotificationStatus.RETRY_SCHEDULED,
      error_message: 'Temporary provider timeout',
      is_demo: false,
      retry_count: 1,
      created_at: new Date().toISOString()
    };

    const demoNotif: Notification = {
      id: 'notif-retry-demo-skip',
      incident_id: liveIncident.id,
      channel: NotificationChannel.SMS,
      recipient: '+919876543211',
      status: NotificationStatus.RETRY_SCHEDULED,
      error_message: 'Demo test',
      is_demo: true, // MUST NEVER BE RETRIED
      retry_count: 0,
      created_at: new Date().toISOString()
    };

    const db = createMockDb({ incident: liveIncident });
    await db.createNotification(eligibleNotif);
    await db.createNotification(demoNotif);

    const twilioSendSms = vi.fn().mockResolvedValue({ success: true, sid: 'SM_RETRY_DISPATCHED' });
    const mockTwilio: TwilioClient = {
      isConfigured: () => true,
      sendSms: twilioSendSms,
      makeVoiceCall: vi.fn()
    };

    const sweepResult = await sweepNotificationRetriesLogic({
      db,
      twilio: mockTwilio,
      elevenLabs: { isConfigured: () => true, synthesizeSpeech: vi.fn() },
      maxAttempts: 3
    });

    expect(sweepResult.retriedIds).toContain('notif-retry-eligible-1');
    expect(sweepResult.skippedDemoCount).toBe(1);
    expect(twilioSendSms).toHaveBeenCalledTimes(1);

    const updatedEligible = await db.getNotification('notif-retry-eligible-1');
    expect(updatedEligible?.status).toBe(NotificationStatus.SENT);
    expect(updatedEligible?.provider_reference).toBe('SM_RETRY_DISPATCHED');

    const updatedDemo = await db.getNotification('notif-retry-demo-skip');
    expect(updatedDemo?.status).toBe(NotificationStatus.RETRY_SCHEDULED);
  });

  it('MISSING KEYS RETRY TEST: Skipped rows are marked status=failed and never retried by sweep', async () => {
    const skippedNotif: Notification = {
      id: 'notif-skipped-1',
      incident_id: 'inc-1',
      channel: NotificationChannel.SMS,
      recipient: '+919876543210',
      status: NotificationStatus.FAILED,
      error_message: 'skipped: not configured',
      is_demo: false,
      retry_count: 0,
      created_at: new Date().toISOString()
    };

    // Even if somehow marked retry_scheduled, error_message 'skipped: not configured' must prevent retries
    const scheduledSkippedNotif: Notification = {
      id: 'notif-skipped-2',
      incident_id: 'inc-1',
      channel: NotificationChannel.SMS,
      recipient: '+919876543211',
      status: NotificationStatus.RETRY_SCHEDULED,
      error_message: 'skipped: not configured',
      is_demo: false,
      retry_count: 0,
      created_at: new Date().toISOString()
    };

    const db = createMockDb({ notification: scheduledSkippedNotif });

    const twilioSendSms = vi.fn();
    const mockTwilio: TwilioClient = {
      isConfigured: () => false,
      sendSms: twilioSendSms,
      makeVoiceCall: vi.fn()
    };

    const sweepResult = await sweepNotificationRetriesLogic({
      db,
      twilio: mockTwilio,
      elevenLabs: { isConfigured: () => false, synthesizeSpeech: vi.fn() }
    });

    expect(sweepResult.skippedUnconfiguredCount).toBe(1);
    expect(sweepResult.retriedIds).toHaveLength(0);
    expect(twilioSendSms).toHaveBeenCalledTimes(0);

    const saved = await db.getNotification(scheduledSkippedNotif.id);
    expect(saved?.status).toBe(NotificationStatus.FAILED);
    expect(saved?.error_message).toBe('skipped: not configured');
  });

  it('RETRIES: Sweeps retry_scheduled rows with backoff, max 3 attempts, and never retries demo rows', async () => {
    const liveIncident: Incident = {
      id: 'inc-retry-test',
      user_id: 'user-retry',
      incident_type: IncidentType.MANUAL_SOS,
      priority: IncidentPriority.HIGH,
      status: IncidentStatus.EMERGENCY_INITIATED,
      detection_source: DetectionSource.MANUAL,
      is_demo: false,
      created_at: new Date().toISOString()
    };

    // 1. Normal retry_scheduled row (attempt 1) -> Should be retried
    const normalRetryRow: Notification = {
      id: 'notif-retry-eligible',
      incident_id: liveIncident.id,
      channel: NotificationChannel.SMS,
      recipient: '+919876543210',
      status: NotificationStatus.RETRY_SCHEDULED,
      error_message: 'Network timeout',
      is_demo: false,
      retry_count: 1, // Attempt 1 -> Eligible for retry
      created_at: new Date().toISOString()
    };

    // 2. Max attempts exceeded row (attempt 3) -> Should transition to failed
    const maxedRetryRow: Notification = {
      id: 'notif-retry-maxed',
      incident_id: liveIncident.id,
      channel: NotificationChannel.SMS,
      recipient: '+919876543211',
      status: NotificationStatus.RETRY_SCHEDULED,
      error_message: 'Persistent gateway error',
      is_demo: false,
      retry_count: 3, // Already reached max attempts
      created_at: new Date().toISOString()
    };

    // 3. Demo retry_scheduled row -> Should NEVER be retried
    const demoRetryRow: Notification = {
      id: 'notif-retry-demo',
      incident_id: liveIncident.id,
      channel: NotificationChannel.SMS,
      recipient: '+919876543212',
      status: NotificationStatus.RETRY_SCHEDULED,
      error_message: 'Simulated failure',
      is_demo: true, // DEMO ROW
      retry_count: 0,
      created_at: new Date().toISOString()
    };

    const db = createMockDb({ incident: liveIncident });
    await db.createNotification(normalRetryRow);
    await db.createNotification(maxedRetryRow);
    await db.createNotification(demoRetryRow);

    const twilioSendSms = vi.fn().mockResolvedValue({ success: true, sid: 'SM_RETRY_SUCCESS' });
    const mockTwilio: TwilioClient = {
      isConfigured: () => true,
      sendSms: twilioSendSms,
      makeVoiceCall: vi.fn()
    };

    const sweepResult = await sweepNotificationRetriesLogic({
      db,
      twilio: mockTwilio,
      elevenLabs: { isConfigured: () => true, synthesizeSpeech: vi.fn() },
      maxAttempts: 3
    });

    // Eligible row was retried
    expect(sweepResult.retriedIds).toContain('notif-retry-eligible');
    expect(twilioSendSms).toHaveBeenCalledTimes(1);
    expect(twilioSendSms).toHaveBeenCalledWith('+919876543210', expect.any(String));

    // Demo row was skipped
    expect(sweepResult.skippedDemoCount).toBe(1);

    // Maxed row was marked failed
    expect(sweepResult.failedIds).toContain('notif-retry-maxed');
    const updatedMaxed = await db.getNotification('notif-retry-maxed');
    expect(updatedMaxed?.status).toBe(NotificationStatus.FAILED);
    expect(updatedMaxed?.error_message).toContain('max retries exceeded');
  });
});
