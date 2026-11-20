import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { z } from 'https://esm.sh/zod@3.22.4';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { authenticateCaller, validateTwilioSignature } from '../_shared/auth.ts';
import { defaultRateLimiter } from '../_shared/rateLimit.ts';
import { createSupabaseDbClient } from '../_shared/dbAdapter.ts';
import { TwilioProvider, ElevenLabsProvider } from '../_shared/providers.ts';
import { sendNotificationLogic, handleTwilioStatusWebhook, sweepNotificationRetriesLogic } from '../_shared/services/notificationService.ts';

const RequestSchema = z.object({
  notification_id: z.string().uuid('Valid notification UUID is required').optional(),
  action: z.enum(['dispatch', 'sweep_retries']).optional().default('dispatch')
});

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
  const supabase = createClient(supabaseUrl, serviceKey);
  const db = createSupabaseDbClient(supabase);

  const contentType = req.headers.get('content-type') || '';
  const url = new URL(req.url);

  // 1. Handle Twilio Status Callback Webhook (deployed without JWT verification)
  if (contentType.includes('application/x-www-form-urlencoded') || url.searchParams.get('action') === 'webhook') {
    const formData = await req.formData();
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    // Validate X-Twilio-Signature with TWILIO_AUTH_TOKEN
    const twilioSignature = req.headers.get('X-Twilio-Signature') || req.headers.get('x-twilio-signature');
    const isValidSignature = await validateTwilioSignature(
      twilioAuthToken,
      twilioSignature,
      req.url,
      params
    );

    if (!isValidSignature) {
      return new Response(JSON.stringify({ error: 'Forbidden: Invalid Twilio signature' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const payload = {
      MessageSid: params.MessageSid,
      CallSid: params.CallSid,
      MessageStatus: params.MessageStatus,
      CallStatus: params.CallStatus,
      ErrorMessage: params.ErrorMessage
    };

    await handleTwilioStatusWebhook(payload, db);
    return new Response('Webhook received', { status: 200, headers: corsHeaders });
  }

  // 2. Authenticate caller for internal dispatches (JWT or service role key required)
  const authContext = await authenticateCaller(req, supabase, serviceKey);
  if (!authContext) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Valid JWT or Service Key required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // 3. Rate limiting
  const rateLimit = defaultRateLimiter.check(authContext.userId);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const rawBody = await req.json();
    const parseResult = RequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return new Response(JSON.stringify({ error: 'Invalid request body', details: parseResult.error.issues }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const twilio = new TwilioProvider({
      accountSid: Deno.env.get('TWILIO_ACCOUNT_SID'),
      authToken: twilioAuthToken,
      fromNumber: Deno.env.get('TWILIO_PHONE_NUMBER')
    });

    const elevenLabs = new ElevenLabsProvider({
      apiKey: Deno.env.get('ELEVENLABS_API_KEY'),
      voiceId: Deno.env.get('ELEVENLABS_VOICE_ID')
    });

    // Handle retry sweep action
    if (parseResult.data.action === 'sweep_retries') {
      const sweepResult = await sweepNotificationRetriesLogic({
        db,
        twilio,
        elevenLabs,
        maxAttempts: 3
      });
      return new Response(JSON.stringify(sweepResult), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!parseResult.data.notification_id) {
      return new Response(JSON.stringify({ error: 'notification_id is required for dispatch' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = await sendNotificationLogic(parseResult.data.notification_id, {
      db,
      twilio,
      elevenLabs,
      maxRetries: 3
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: unknown) {
    const message = (err as { message?: string })?.message || String(err);
    console.error('Error in send-notification:', err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
