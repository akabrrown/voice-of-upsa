/**
 * @deprecated This file is deprecated. Use @/lib/supabase/client instead.
 * 
 * This file now re-exports from lib/supabase/client.ts to maintain backward compatibility
 * and prevent multiple Supabase client instances.
 */

// Re-export all auth functions from the canonical client file
export {
  signInWithEmail,
  signUpWithEmail,
  signOut,
  updatePassword,
  resetPassword,
  getCurrentSession as getSession,
  getCurrentUser,
} from './supabase/client';
