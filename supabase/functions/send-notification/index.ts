import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { z } from 'https://esm.sh/zod@3.22.4';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { authenticateCaller } from '../_shared/auth.ts';
import { defaultRateLimiter } from '../_shared/rateLimit.ts';
import { createSupabaseDbClient } from '../_shared/dbAdapter.ts';
import { TwilioProvider, ElevenLabsProvider } from '../_shared/providers.ts';
import { sendNotificationLogic, handleTwilioStatusWebhook } from '../_shared/services/notificationService.ts';

const RequestSchema = z.object({
  notification_id: z.string().uuid('Valid notification UUID is required')
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
  const supabase = createClient(supabaseUrl, serviceKey);
  const db = createSupabaseDbClient(supabase);

  const contentType = req.headers.get('content-type') || '';

  // 1. Handle Twilio Status Callback Webhook
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await req.formData();
    const payload = {
      MessageSid: formData.get('MessageSid')?.toString(),
      CallSid: formData.get('CallSid')?.toString(),
      MessageStatus: formData.get('MessageStatus')?.toString(),
      CallStatus: formData.get('CallStatus')?.toString(),
      ErrorMessage: formData.get('ErrorMessage')?.toString()
    };

    await handleTwilioStatusWebhook(payload, db);
    return new Response('Webhook received', { status: 200, headers: corsHeaders });
  }

  // 2. Authenticate caller (JWT or service role key)
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

    const { notification_id } = parseResult.data;
    const twilio = new TwilioProvider();
    const elevenLabs = new ElevenLabsProvider();

    const result = await sendNotificationLogic(notification_id, {
      db,
      twilio,
      elevenLabs
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
