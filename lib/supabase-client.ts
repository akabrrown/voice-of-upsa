import { getSupabaseClient } from './supabaseClient';

// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

// Sign up with email and password
export async function signUpWithEmail(email: string, password: string, metadata?: Record<string, unknown>) {
  const supabase = getSupabaseClient();
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
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Update password
export async function updatePassword(newPassword: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return { data, error };
}

// Reset password (send reset email)
export async function resetPassword(email: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  return { data, error };
}

// Get current session
export async function getSession() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  return { data, error };
}

// Get current user
export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}
