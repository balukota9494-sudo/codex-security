import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://rxyxenrcccxbshcnkygf.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4eXhlbnJjY2N4YnNoY25reWdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNjgxNTMsImV4cCI6MjEwNjg0NDE1M30.Zc4Fg7gq0SiKC4sCJTUXW593ZGUuGmGL0GT54nzq55c";

/**
 * Supabase Browser Client.
 * STRICT SECURITY INVARIANT:
 * Initialized strictly with the public anon key.
 * The server service-role key is NEVER exposed or imported here.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
