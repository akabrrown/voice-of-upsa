import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create client-side Supabase client factory function
export function createSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl!, supabaseAnonKey!);
}

// Export a singleton for backward compatibility (but encourage using factory)
let supabase: SupabaseClient | null = null;
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    supabase = createSupabaseClient();
  }
  return supabase;
};
