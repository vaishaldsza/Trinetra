import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1?target=deno';
import { z } from 'https://esm.sh/zod@3.22.4?target=deno';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { authenticateCaller, authorizeIncidentAccess } from '../_shared/auth.ts';
import { defaultRateLimiter } from '../_shared/rateLimit.ts';
import { createSupabaseDbClient } from '../_shared/dbAdapter.ts';
import { processIncidentLogic } from '../_shared/services/incidentProcessor.ts';

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

const RequestSchema = z.object({
  incident_id: z.string().uuid('Valid incident UUID is required')
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
  const supabase = createClient(supabaseUrl, serviceKey);

  // 1. Authenticate caller (JWT or service role key)
  const authContext = await authenticateCaller(req, supabase, serviceKey);
  if (!authContext) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Valid JWT or Service Key required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // 2. Per-user rate limiting
  const rateLimit = defaultRateLimiter.check(authContext.userId);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
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

    const { incident_id } = parseResult.data;
    const db = createSupabaseDbClient(supabase);

    // 3. Verify incident exists and caller has permission (incident owner or service role)
    const authz = await authorizeIncidentAccess(incident_id, db, authContext);
    if (!authz.allowed) {
      return new Response(JSON.stringify({ error: authz.error }), {
        status: authz.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = await processIncidentLogic(incident_id, {
      db,
      async runAgentTask(taskId: string) {
        supabase.functions.invoke('run-agent-task', {
          body: { task_id: taskId }
        }).catch((err) => console.error(`Error invoking run-agent-task for ${taskId}:`, err));
      },
      async sendNotification(notificationId: string) {
        supabase.functions.invoke('send-notification', {
          body: { notification_id: notificationId }
        }).catch((err) => console.error(`Error invoking send-notification for ${notificationId}:`, err));
      }
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: unknown) {
    const message = (err as { message?: string })?.message || String(err);
    console.error('Error in process-incident:', err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
