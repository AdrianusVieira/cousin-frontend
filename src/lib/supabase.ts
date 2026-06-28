import { createClient } from "@supabase/supabase-js";

import { env } from "./env";

/**
 * The FE owns the auth flow; the BE only verifies the JWT. This is a single-owner app,
 * so there is no signup — the owner user is provisioned in the Supabase dashboard.
 * `session.access_token` is injected into API requests by the fetch client.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
});

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();

  return data.session?.access_token ?? null;
}
