import { createAdminClient } from './supabase/server'

// Redefine as any for backward compatibility and to avoid cascading type fixes in Option A
export type SupabaseAdmin = any; 

// Admin client instance (lazy initialization)
let adminClient: SupabaseAdmin | null = null;

// Helper function to get admin client
export async function getSupabaseAdmin(): Promise<SupabaseAdmin> {
  if (!adminClient) {
    adminClient = await createAdminClient() as SupabaseAdmin | null;
    if (!adminClient) {
      console.warn('Supabase admin client not available. Using simple auth mode.');
    }
  }
  return adminClient as SupabaseAdmin;
}

// Export the admin client for backward compatibility (deprecated)
export const supabaseAdmin = getSupabaseAdmin();
