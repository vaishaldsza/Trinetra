import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1?target=deno';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { authenticateCaller } from '../_shared/auth.ts';
import { createSupabaseDbClient } from '../_shared/dbAdapter.ts';
import { TwilioProvider, ElevenLabsProvider } from '../_shared/providers.ts';
import { sweepNotificationRetriesLogic } from '../_shared/services/notificationService.ts';

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

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
  const supabase = createClient(supabaseUrl, serviceKey);

  // 1. Authenticate caller: Strict SERVICE-ROLE authorization required
  const authContext = await authenticateCaller(req, supabase, serviceKey);
  if (!authContext) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Service Key required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!authContext.isServiceRole) {
    return new Response(JSON.stringify({ error: 'Forbidden: Service role required for retry sweep' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const db = createSupabaseDbClient(supabase);

    const twilio = new TwilioProvider({
      accountSid: Deno.env.get('TWILIO_ACCOUNT_SID'),
      authToken: Deno.env.get('TWILIO_AUTH_TOKEN'),
      fromNumber: Deno.env.get('TWILIO_PHONE_NUMBER')
    });

    const elevenLabs = new ElevenLabsProvider({
      apiKey: Deno.env.get('ELEVENLABS_API_KEY'),
      voiceId: Deno.env.get('ELEVENLABS_VOICE_ID')
    });

    // Run sweep: dispatches eligible retry_scheduled rows with backoff, max 3 attempts. Never retries demo rows.
    const result = await sweepNotificationRetriesLogic({
      db,
      twilio,
      elevenLabs,
      maxAttempts: 3
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: unknown) {
    const message = (err as { message?: string })?.message || String(err);
    console.error('Error in retry-notifications function:', err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
