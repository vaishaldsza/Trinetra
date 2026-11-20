import {
  Notification,
  NotificationChannel,
  NotificationStatus,
  Incident
} from '@trinetra/shared';
import { DatabaseClient, TwilioClient, ElevenLabsClient } from '../types';

export interface NotificationServiceDeps {
  db: DatabaseClient;
  twilio: TwilioClient;
  elevenLabs: ElevenLabsClient;
  maxRetries?: number;
}

export interface NotificationDispatchResult {
  notificationId: string;
  status: NotificationStatus;
  providerReference?: string;
  errorMessage?: string;
}

export async function sendNotificationLogic(
  notificationId: string,
  deps: NotificationServiceDeps
): Promise<NotificationDispatchResult> {
  const notif = await deps.db.getNotification(notificationId);
  if (!notif) {
    throw new Error(`Notification not found: ${notificationId}`);
  }

  const incident = await deps.db.getIncident(notif.incident_id);

  // Status transition: PENDING -> PROCESSING
  await deps.db.updateNotification(notif.id, {
    status: NotificationStatus.PROCESSING
  });

  // 1. DEMO GUARD: If incident or notification is demo, NEVER call Twilio or ElevenLabs
  if (incident?.is_demo === true || notif.is_demo === true) {
    const providerRef = `DEMO-REF-${notif.id.slice(0, 8)}`;
    const demoMsg = '[DEMO] Notification simulated. Real outbound dispatches suppressed in Demo Mode.';

    await deps.db.updateNotification(notif.id, {
      status: NotificationStatus.DELIVERED,
      provider_reference: providerRef,
      error_message: demoMsg
    });

    return {
      notificationId: notif.id,
      status: NotificationStatus.DELIVERED,
      providerReference: providerRef,
      errorMessage: demoMsg
    };
  }

  // 2. MISSING KEYS CHECK: If credentials unconfigured, mark as "skipped: not configured"
  if (!deps.twilio.isConfigured()) {
    const skipMsg = 'skipped: not configured';
    await deps.db.updateNotification(notif.id, {
      status: NotificationStatus.FAILED,
      error_message: skipMsg
    });

    return {
      notificationId: notif.id,
      status: NotificationStatus.FAILED,
      errorMessage: skipMsg
    };
  }

  // 3. Dispatch Notification via Provider
  try {
    const latStr = incident?.latitude ? incident.latitude.toFixed(4) : 'Unknown';
    const lonStr = incident?.longitude ? incident.longitude.toFixed(4) : 'Unknown';
    const priorityStr = incident?.priority?.toUpperCase() || 'HIGH';

    if (notif.channel === NotificationChannel.SMS) {
      const messageText = `[TRINETRA SAFETY ALERT] Emergency incident reported. Priority: ${priorityStr}. GPS Coordinates: ${latStr}, ${lonStr}. Responders notified.`;
      const twilioRes = await deps.twilio.sendSms(notif.recipient, messageText);

      if (twilioRes.success && twilioRes.sid) {
        await deps.db.updateNotification(notif.id, {
          status: NotificationStatus.SENT,
          provider_reference: twilioRes.sid,
          error_message: undefined
        });

        return {
          notificationId: notif.id,
          status: NotificationStatus.SENT,
          providerReference: twilioRes.sid
        };
      } else {
        const errorMsg = twilioRes.error || 'Twilio SMS send error';
        await deps.db.updateNotification(notif.id, {
          status: NotificationStatus.FAILED,
          error_message: errorMsg
        });

        return {
          notificationId: notif.id,
          status: NotificationStatus.FAILED,
          errorMessage: errorMsg
        };
      }
    } else if (notif.channel === NotificationChannel.VOICE) {
      let voiceUrl = 'https://demo.twilio.com/docs/voice.xml';

      if (deps.elevenLabs.isConfigured()) {
        const voiceScript = `Emergency alert from Trinetra outdoor safety system. An incident with priority ${priorityStr} has been reported for your contact.`;
        const speechRes = await deps.elevenLabs.synthesizeSpeech(voiceScript);
        if (speechRes.success && speechRes.audioUrl) {
          voiceUrl = speechRes.audioUrl;
        }
      }

      const twilioRes = await deps.twilio.makeVoiceCall(notif.recipient, voiceUrl);

      if (twilioRes.success && twilioRes.sid) {
        await deps.db.updateNotification(notif.id, {
          status: NotificationStatus.SENT,
          provider_reference: twilioRes.sid,
          error_message: undefined
        });

        return {
          notificationId: notif.id,
          status: NotificationStatus.SENT,
          providerReference: twilioRes.sid
        };
      } else {
        const errorMsg = twilioRes.error || 'Twilio voice call error';
        await deps.db.updateNotification(notif.id, {
          status: NotificationStatus.FAILED,
          error_message: errorMsg
        });

        return {
          notificationId: notif.id,
          status: NotificationStatus.FAILED,
          errorMessage: errorMsg
        };
      }
    }

    return {
      notificationId: notif.id,
      status: NotificationStatus.FAILED,
      errorMessage: `Unsupported channel: ${notif.channel}`
    };
  } catch (err: unknown) {
    const errorMsg = (err as { message?: string })?.message || String(err);
    await deps.db.updateNotification(notif.id, {
      status: NotificationStatus.FAILED,
      error_message: errorMsg
    });

    return {
      notificationId: notif.id,
      status: NotificationStatus.FAILED,
      errorMessage: errorMsg
    };
  }
}

/**
 * Maps Twilio delivery webhook callbacks to internal notification statuses.
 */
export async function handleTwilioStatusWebhook(
  payload: { MessageSid?: string; CallSid?: string; MessageStatus?: string; CallStatus?: string; ErrorMessage?: string },
  db: DatabaseClient
): Promise<void> {
  const sid = payload.MessageSid || payload.CallSid;
  if (!sid) return;

  const rawStatus = (payload.MessageStatus || payload.CallStatus || '').toLowerCase();
  let status: NotificationStatus = NotificationStatus.PROCESSING;

  if (['delivered', 'completed'].includes(rawStatus)) {
    status = NotificationStatus.DELIVERED;
  } else if (['sent', 'in-progress'].includes(rawStatus)) {
    status = NotificationStatus.SENT;
  } else if (['failed', 'undelivered', 'busy', 'no-answer', 'canceled'].includes(rawStatus)) {
    status = NotificationStatus.FAILED;
  }

  // Find notification by provider_reference
  const notif = await db.getNotification(sid);
  if (notif) {
    await db.updateNotification(notif.id, {
      status,
      error_message: payload.ErrorMessage || undefined
    });
  }
}
