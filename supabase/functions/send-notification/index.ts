import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1?target=deno';
import { z } from 'https://esm.sh/zod@3.22.4?target=deno';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { authenticateCaller } from '../_shared/auth.ts';
import { defaultRateLimiter } from '../_shared/rateLimit.ts';
import { createSupabaseDbClient } from '../_shared/dbAdapter.ts';
import { TwilioProvider, ElevenLabsProvider } from '../_shared/providers.ts';
import { sendNotificationLogic, sweepNotificationRetriesLogic } from '../_shared/services/notificationService.ts';

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

const RequestSchema = z.object({
  notification_id: z.string().uuid('Valid notification UUID is required').optional(),
  action: z.enum(['dispatch', 'sweep_retries']).optional().default('dispatch')
});

Deno.serve(async (req: Request) => {
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

  // 1. Authenticate caller (Strict JWT or Service Key required)
  const authContext = await authenticateCaller(req, supabase, serviceKey);
  if (!authContext) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Valid JWT or Service Key required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // 2. Rate limiting
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
