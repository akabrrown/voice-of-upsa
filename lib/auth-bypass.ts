// Complete bypass for Supabase Auth to eliminate AuthApiError rate limiting
// This file provides alternative implementations for all auth operations

import { verifyToken, generateToken } from './simple-auth';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name?: string;
}

// Bypass for supabase.auth.getUser()
export async function getUserBypass(token: string): Promise<{ user: AuthUser | null; error: any }> {
  try {
    const user = verifyToken(token);
    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

// Bypass for supabase.auth.signInWithPassword()
export async function signInBypass(email: string, password: string): Promise<{ data: any; error: any }> {
  try {
    // Redirect to simple login - no Supabase auth calls
    const response = await fetch('/api/auth/simple-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const result = await response.json();
    
    if (result.success) {
      return { 
        data: { 
          user: result.user,
          session: { access_token: result.token }
        }, 
        error: null 
      };
    } else {
      return { data: null, error: { message: result.error } };
    }
  } catch (error) {
    return { data: null, error };
  }
}

// Bypass for supabase.auth.signOut()
export async function signOutBypass(): Promise<{ error: any }> {
  try {
    // Simple sign-out - just clear token on client side
    return { error: null };
  } catch (error) {
    return { error };
  }
}

// Bypass for supabase.auth.signUp()
export async function signUpBypass(email: string, password: string, options?: any): Promise<{ data: any; error: any }> {
  try {
    // For now, disable sign-up to avoid Supabase auth calls
    return { 
      data: null, 
      error: { message: 'Sign-up temporarily disabled. Please contact administrator.' } 
    };
  } catch (error) {
    return { data: null, error };
  }
}

// Bypass for supabase.auth.resetPasswordForEmail()
export async function resetPasswordBypass(email: string): Promise<{ data: any; error: any }> {
  try {
    // For now, disable password reset to avoid Supabase auth calls
    return { 
      data: null, 
      error: { message: 'Password reset temporarily disabled. Please contact administrator.' } 
    };
  } catch (error) {
    return { data: null, error };
  }
}

// Bypass for supabase.auth.admin.listUsers()
export async function listUsersBypass(): Promise<{ data: any; error: any }> {
  try {
    // Use database directly instead of Supabase auth admin
    const response = await fetch('/api/admin/users');
    const result = await response.json();
    
    if (result.success) {
      return { data: { users: result.data?.users || [] }, error: null };
    } else {
      return { data: null, error: { message: result.error } };
    }
  } catch (error) {
    return { data: null, error };
  }
}

// Helper to create mock Supabase auth client that uses bypass
export function createAuthBypassClient() {
  return {
    auth: {
      getUser: (token: string) => getUserBypass(token),
      signInWithPassword: ({ email, password }: { email: string; password: string }) => signInBypass(email, password),
      signOut: () => signOutBypass(),
      signUp: ({ email, password }: { email: string; password: string }) => signUpBypass(email, password),
      resetPasswordForEmail: (email: string) => resetPasswordBypass(email),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      admin: {
        listUsers: () => listUsersBypass()
      }
    }
  };
}
