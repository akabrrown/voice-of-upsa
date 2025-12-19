import { createAdminClient } from './supabase/server'

// Admin client instance (lazy initialization)
let adminClient: Awaited<ReturnType<typeof createAdminClient>> | null = null;

// Helper function to get admin client
export async function getSupabaseAdmin() {
  if (!adminClient) {
    adminClient = await createAdminClient();
    if (!adminClient) {
      console.warn('Supabase admin client not available. Using simple auth mode.');
    }
  }
  return adminClient;
}

// Export the admin client for backward compatibility (deprecated)
export const supabaseAdmin = getSupabaseAdmin();
