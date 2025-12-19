/**
 * @deprecated This file is deprecated. Use @/lib/supabase/client instead.
 * 
 * This file now re-exports from lib/supabase/client.ts to maintain backward compatibility
 * and prevent multiple Supabase client instances.
 */

// Re-export everything from the canonical client file
export { 
  createClient as createSupabaseClient,
  getSupabaseClient,
  checkUserExists,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  resetPassword,
  updatePassword,
  getCurrentUser,
  getCurrentSession,
  updateUserMetadata,
  onAuthStateChange
} from './supabase/client';

// Default export for backward compatibility
import { getSupabaseClient } from './supabase/client';
export default getSupabaseClient();
