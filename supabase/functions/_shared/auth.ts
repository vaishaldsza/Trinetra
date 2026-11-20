import { DatabaseClient } from './types';
import { Incident, AgentTask } from './contracts';

export interface SupabaseAuthClient {
  auth: {
    getUser: (jwt: string) => Promise<{ data: { user: { id: string } | null }; error: unknown | null }>;
  };
}

export interface AuthContext {
  userId: string;
  isServiceRole: boolean;
}

/**
 * Authenticates caller using Bearer token (user JWT or Supabase service role key).
 */
export async function authenticateCaller(
  req: Request,
  supabaseClient: SupabaseAuthClient,
  serviceRoleKey?: string
): Promise<AuthContext | null> {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const token = match[1];

  // 1. Check if token is the configured service role secret
  if (serviceRoleKey && token === serviceRoleKey) {
    return {
      userId: 'service_role',
      isServiceRole: true
    };
  }

  // 2. Validate user JWT via Supabase Auth
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    if (error || !user) {
      return null;
    }
    return {
      userId: user.id,
      isServiceRole: false
    };
  } catch {
    return null;
  }
}

/**
 * Verifies caller has permission to access an incident.
 * Allowed if caller is service_role OR caller's userId matches incident.user_id.
 * Otherwise returns 403 Forbidden.
 */
export async function authorizeIncidentAccess(
  incidentId: string,
  db: DatabaseClient,
  authContext: AuthContext
): Promise<{ allowed: boolean; incident?: Incident; status: number; error?: string }> {
  const incident = await db.getIncident(incidentId);
  if (!incident) {
    return { allowed: false, status: 404, error: `Incident not found: ${incidentId}` };
  }
  if (authContext.isServiceRole || incident.user_id === authContext.userId) {
    return { allowed: true, incident, status: 200 };
  }
  return {
    allowed: false,
    incident,
    status: 403,
    error: 'Forbidden: Caller is not the incident owner or service role'
  };
}

/**
 * Verifies caller has permission to execute or access an agent task.
 * Allowed if caller is service_role OR caller's userId matches the task's parent incident.user_id.
 * Otherwise returns 403 Forbidden.
 */
export async function authorizeTaskAccess(
  taskId: string,
  db: DatabaseClient,
  authContext: AuthContext
): Promise<{ allowed: boolean; task?: AgentTask; incident?: Incident; status: number; error?: string }> {
  const task = await db.getAgentTask(taskId);
  if (!task) {
    return { allowed: false, status: 404, error: `Task not found: ${taskId}` };
  }
  const incident = await db.getIncident(task.incident_id);
  if (!incident) {
    return { allowed: false, status: 404, error: `Incident not found: ${task.incident_id}` };
  }
  if (authContext.isServiceRole || incident.user_id === authContext.userId) {
    return { allowed: true, task, incident, status: 200 };
  }
  return {
    allowed: false,
    task,
    incident,
    status: 403,
    error: 'Forbidden: Caller is not the incident owner or service role'
  };
}

/**
 * Computes Twilio HMAC-SHA1 signature from URL and form params.
 */
export async function computeTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>
): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  let dataToSign = url;
  for (const key of sortedKeys) {
    dataToSign += key + (params[key] ?? '');
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(authToken);
  const messageData = encoder.encode(dataToSign);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  let binary = '';
  const bytes = new Uint8Array(signatureBuffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Validates the X-Twilio-Signature against the configured TWILIO_WEBHOOK_URL, form params, and auth token.
 * Security requirement: URL is strictly built from the TWILIO_WEBHOOK_URL secret, never from incoming req.url.
 */
export async function validateTwilioSignature(
  authToken: string | undefined,
  twilioSignature: string | null | undefined,
  webhookUrl: string | undefined,
  params: Record<string, string>
): Promise<boolean> {
  if (!authToken || !twilioSignature || !webhookUrl) {
    return false;
  }
  try {
    const expected = await computeTwilioSignature(authToken, webhookUrl, params);
    return expected === twilioSignature;
  } catch {
    return false;
  }
}
