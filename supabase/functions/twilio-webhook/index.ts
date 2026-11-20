import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1?target=deno';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { validateTwilioSignature } from '../_shared/auth.ts';
import { createSupabaseDbClient } from '../_shared/dbAdapter.ts';
import { handleTwilioStatusWebhook } from '../_shared/services/notificationService.ts';

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
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
  const twilioWebhookUrl = Deno.env.get('TWILIO_WEBHOOK_URL') || '';

  const supabase = createClient(supabaseUrl, serviceKey);
  const db = createSupabaseDbClient(supabase);

  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('application/x-www-form-urlencoded')) {
    return new Response(JSON.stringify({ error: 'Invalid content type: expected application/x-www-form-urlencoded' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const formData = await req.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    params[key] = value.toString();
  }

  // Security: Signature validation uses TWILIO_WEBHOOK_URL secret, not req.url
  const twilioSignature = req.headers.get('X-Twilio-Signature') || req.headers.get('x-twilio-signature');
  const isValidSignature = await validateTwilioSignature(
    twilioAuthToken,
    twilioSignature,
    twilioWebhookUrl,
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
});
