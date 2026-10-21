import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.trim() !== "" &&
    supabaseAnonKey.trim() !== ""
);

if (!isSupabaseConfigured) {
  console.error(
    "[Supabase] Missing Supabase configuration: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY are not set in .env. Please paste your Supabase URL and anon key into .env to fetch live data."
  );
}

// Fallback to dummy endpoint so createClient does not throw on module initialization
export const supabase: SupabaseClient = createClient(
  supabaseUrl && supabaseUrl.trim() !== "" ? supabaseUrl : "https://placeholder.supabase.co",
  supabaseAnonKey && supabaseAnonKey.trim() !== "" ? supabaseAnonKey : "placeholder-key"
);
