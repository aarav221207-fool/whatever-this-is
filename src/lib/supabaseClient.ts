import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Read from standard Vite environment variables, supporting common deployment aliases
const rawUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_PUBLIC_SUPABASE_URL ||
  "";

const rawAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_KEY ||
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "";

export const supabaseUrl = rawUrl.trim();
export const supabaseAnonKey = rawAnonKey.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "" &&
    supabaseAnonKey !== "" &&
    !supabaseUrl.includes("placeholder") &&
    (supabaseUrl.startsWith("http://") || supabaseUrl.startsWith("https://"))
);

if (!isSupabaseConfigured) {
  console.error(
    "[Supabase Client] Critical: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing or invalid in the build environment. Database queries will report this error in the UI. In Netlify, set these under Site Configuration > Environment Variables and redeploy."
  );
}

// Export client instance; if not configured, calls will cleanly return an error payload
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : "https://unconfigured-project.supabase.co",
  isSupabaseConfigured ? supabaseAnonKey : "unconfigured-key"
);
