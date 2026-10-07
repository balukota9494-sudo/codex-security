import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

/**
 * Creates an RLS-enforced Supabase client scoped strictly to the authenticated user's JWT.
 * Ensures the database enforces Row Level Security using auth.uid().
 * Never accepts or relies on client-supplied user_id.
 */
export function createUserClient(jwt: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
  });
}
