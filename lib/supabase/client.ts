import { createBrowserClient } from '@supabase/ssr'
import { Database } from '../../lib/database-types'

export function createClient() {
  // Create a Supabase client for use in the browser
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Singleton pattern for client-side usage
let client: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!client) {
    client = createClient()
  }
  return client
}

// Helper functions for common auth operations
// Helper function to check if user exists
export async function checkUserExists(email: string) {
  const supabase = getSupabaseClient()
  
  // Use admin client to check if user exists without requiring authentication
  try {
    // We'll use a different approach - try to sign up with the email to see if it exists
    // This is a workaround since we don't have direct admin access from client
    const { data, error } = await supabase.auth.signUp({
      email,
      password: 'temp-password-for-check',
      options: {
        data: { temp_check: true }
      }
    })
    
    // If user already exists, we'll get an error
    if (error && error.message.includes('already registered')) {
      return { exists: true, error: null }
    }
    
    // If sign up succeeded, we need to clean up the temporary user
    if (data.user && !error) {
      // Try to delete the temporary user
      // Note: This requires admin privileges, so we can't do it from client
      console.warn('Temporary user created during check - please clean up manually:', email)
      return { exists: false, error: null }
    }
    
    return { exists: false, error }
  } catch (err) {
    return { exists: false, error: err }
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const supabase = getSupabaseClient()
    
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client')
    }
    
    // Add debugging to see what's happening
    console.log('Attempting sign in for email:', email)
    console.log('Supabase client initialized:', !!supabase.auth)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Sign in error details:', {
        message: error.message,
        status: error.status,
        name: error.name
      })
      throw error
    }

    console.log('Sign in successful, user:', data.user?.email)
    console.log('Sign in result data:', data)
    return data
  } catch (error) {
    console.error('signInWithEmail error:', error)
    throw error
  }
}

export async function signUpWithEmail(email: string, password: string, options?: {
  data?: { [key: string]: unknown }
  redirectTo?: string
}) {
  const supabase = getSupabaseClient()
  
  // Build options object without undefined properties
  const signUpOptions: {
    emailRedirectTo?: string;
    data?: object;
  } = {}
  
  if (options?.data) {
    signUpOptions.data = options.data
  }
  
  if (options?.redirectTo) {
    signUpOptions.emailRedirectTo = options.redirectTo
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: signUpOptions,
  })

  if (error) {
    throw error
  }

  return data
}

export async function signOut() {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }

  return true
}

export async function resetPassword(email: string, redirectTo?: string) {
  const supabase = getSupabaseClient()
  
  // Build options object without undefined properties
  const resetOptions: {
    redirectTo?: string;
  } = {}
  
  if (redirectTo) {
    resetOptions.redirectTo = redirectTo
  }
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, resetOptions)

  if (error) {
    throw error
  }

  return data
}

export async function updatePassword(newPassword: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw error
  }

  return data
}

export async function getCurrentUser() {
  const supabase = getSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  return user
}

export async function getCurrentSession() {
  const supabase = getSupabaseClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return session
}

export async function updateUserMetadata(metadata: { [key: string]: unknown }) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  })

  if (error) {
    throw error
  }

  return data
}

export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  const supabase = getSupabaseClient()
  
  return supabase.auth.onAuthStateChange(callback)
}

// Export the default client for backward compatibility
export default getSupabaseClient()
