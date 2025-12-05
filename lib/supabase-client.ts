import { createClient } from '@supabase/supabase-js';

// Create a singleton Supabase client for client-side usage
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

// Sign up with email and password
export async function signUpWithEmail(email: string, password: string, metadata?: Record<string, unknown>) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  return { data, error };
}

// Sign out
export async function signOut() {
  const supabase = createSupabaseClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Update password
export async function updatePassword(newPassword: string) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return { data, error };
}

// Reset password (send reset email)
export async function resetPassword(email: string) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  return { data, error };
}

// Get current session
export async function getSession() {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  return { data, error };
}

// Get current user
export async function getCurrentUser() {
  const supabase = createSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}
