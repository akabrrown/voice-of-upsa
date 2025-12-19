import { getSupabaseClient } from './supabaseClient';

// Export the client getter (lazy evaluation to avoid runtime errors)
export const supabase = getSupabaseClient();
