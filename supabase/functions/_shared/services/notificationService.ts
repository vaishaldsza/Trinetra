import {
  Notification,
  NotificationChannel,
  NotificationStatus,
  Incident
} from '../contracts';
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
      error_message: demoMsg,
      is_demo: true
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
    const maxRetries = deps.maxRetries ?? 3;
    const currentRetryCount = notif.retry_count ?? 0;

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
        const nextStatus = currentRetryCount < maxRetries ? NotificationStatus.RETRY_SCHEDULED : NotificationStatus.FAILED;

        await deps.db.updateNotification(notif.id, {
          status: nextStatus,
          error_message: errorMsg
        });

        return {
          notificationId: notif.id,
          status: nextStatus,
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
        const nextStatus = currentRetryCount < maxRetries ? NotificationStatus.RETRY_SCHEDULED : NotificationStatus.FAILED;

        await deps.db.updateNotification(notif.id, {
          status: nextStatus,
          error_message: errorMsg
        });

        return {
          notificationId: notif.id,
          status: nextStatus,
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
    const maxRetries = deps.maxRetries ?? 3;
    const currentRetryCount = notif.retry_count ?? 0;
    const nextStatus = currentRetryCount < maxRetries ? NotificationStatus.RETRY_SCHEDULED : NotificationStatus.FAILED;

    await deps.db.updateNotification(notif.id, {
      status: nextStatus,
      error_message: errorMsg
    });

    return {
      notificationId: notif.id,
      status: nextStatus,
      errorMessage: errorMsg
    };
  }
}

export interface RetrySweepDeps {
  db: DatabaseClient;
  twilio: TwilioClient;
  elevenLabs: ElevenLabsClient;
  maxAttempts?: number;
}

export interface RetrySweepResult {
  retriedIds: string[];
  failedIds: string[];
  skippedDemoCount: number;
  skippedUnconfiguredCount: number;
}

/**
 * Sweeps all retry_scheduled notifications and applies exponential backoff retries.
 * Never retries demo rows (is_demo = true).
 * Never retries unconfigured rows (error_message = 'skipped: not configured').
 * Caps retries at maxAttempts (default 3).
 */
export async function sweepNotificationRetriesLogic(deps: RetrySweepDeps): Promise<RetrySweepResult> {
  const maxAttempts = deps.maxAttempts ?? 3;
  const candidates = await deps.db.getRetryScheduledNotifications();

  const result: RetrySweepResult = {
    retriedIds: [],
    failedIds: [],
    skippedDemoCount: 0,
    skippedUnconfiguredCount: 0
  };

  for (const notif of candidates) {
    // 1. NEVER retry demo rows
    if (notif.is_demo === true) {
      result.skippedDemoCount++;
      continue;
    }

    // 2. NEVER retry skipped: not configured rows
    if (notif.error_message === 'skipped: not configured') {
      result.skippedUnconfiguredCount++;
      if (notif.status !== NotificationStatus.FAILED) {
        await deps.db.updateNotification(notif.id, {
          status: NotificationStatus.FAILED
        });
      }
      continue;
    }

    // 3. Max attempts check
    const currentAttempts = notif.retry_count ?? 0;
    if (currentAttempts >= maxAttempts) {
      await deps.db.updateNotification(notif.id, {
        status: NotificationStatus.FAILED,
        error_message: `${notif.error_message || 'Error'} (max retries exceeded)`
      });
      result.failedIds.push(notif.id);
      continue;
    }

    // 4. Increment retry count and dispatch
    const nextAttempts = currentAttempts + 1;
    await deps.db.updateNotification(notif.id, {
      retry_count: nextAttempts,
      status: NotificationStatus.PROCESSING
    });

    try {
      await sendNotificationLogic(notif.id, {
        db: deps.db,
        twilio: deps.twilio,
        elevenLabs: deps.elevenLabs,
        maxRetries: maxAttempts
      });
      result.retriedIds.push(notif.id);
    } catch {
      result.failedIds.push(notif.id);
    }
  }

  return result;
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

  switch (rawStatus) {
    case 'delivered':
    case 'completed':
      status = NotificationStatus.DELIVERED;
      break;
    case 'sent':
      status = NotificationStatus.SENT;
      break;
    case 'failed':
    case 'undelivered':
      status = NotificationStatus.FAILED;
      break;
    default:
      return;
  }

  // In production dbAdapter, query by provider_reference
  // Notification updates are handled by provider reference or notification id
  if (db.updateNotification) {
    try {
      const notif = await db.getNotification(sid);
      if (notif) {
        await db.updateNotification(notif.id, {
          status,
          error_message: payload.ErrorMessage || undefined
        });
      }
    } catch {
      // Ignored if lookup fails in testing
    }
  }
}
