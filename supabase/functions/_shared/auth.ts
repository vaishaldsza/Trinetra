import { SupabaseClient } from '@supabase/supabase-js';

export interface AuthContext {
  userId: string;
  isServiceRole: boolean;
}

/**
 * Authenticates caller using Bearer token (user JWT or Supabase service role key).
 */
export async function authenticateCaller(
  req: Request,
  supabaseClient: SupabaseClient,
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
