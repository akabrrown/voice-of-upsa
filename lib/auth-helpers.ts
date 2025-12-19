import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextApiRequest } from 'next';

// Create Supabase client with proper error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: SupabaseClient | null = null;

// Only create Supabase client if environment variables are available
if (supabaseUrl && supabaseServiceKey) {
  try {
    supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  } catch (error) {
    console.error('Failed to create Supabase admin client:', error);
    // Continue without Supabase client - will use fallback methods
  }
} else {
  console.warn('Supabase environment variables not found. Using simple auth mode.');
}

export async function requireAuth(req: NextApiRequest) {
  // Check if Supabase client is available
  if (!supabaseAdmin) {
    console.warn('Supabase client not available. Cannot authenticate with Supabase auth.');
    throw new Error('Authentication service unavailable');
  }

  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) throw new Error('No authentication token');

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) throw new Error('Invalid authentication token');

  // Get user role for context
  const userRole = await getUserRole(user.id);
  console.info(`Authentication successful for user: ${user.id} with role: ${userRole || 'user'}`);
  
  return { ...user, role: userRole || 'user' };
}

export async function requireAdminOrEditor(req: NextApiRequest) {
  // Check if Supabase client is available
  if (!supabaseAdmin) {
    console.warn('Supabase client not available. Cannot authenticate with Supabase auth.');
    throw new Error('Authentication service unavailable');
  }

  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) throw new Error('No authentication token');

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) throw new Error('Invalid authentication token');

  const userRole = await getUserRole(user.id);
  if (!['admin', 'editor'].includes(userRole || 'user')) {
    throw new Error('Insufficient permissions');
  }

  console.info(`Admin/Editor authentication successful for user: ${user.id} with role: ${userRole}`);
  return { ...user, role: userRole || 'user' };
}

export async function requireAdmin(req: NextApiRequest) {
  // Check if Supabase client is available
  if (!supabaseAdmin) {
    console.warn('Supabase client not available. Cannot authenticate with Supabase auth.');
    throw new Error('Authentication service unavailable');
  }

  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) throw new Error('No authentication token');

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) throw new Error('Invalid authentication token');

  // Use helper function to check admin status
  const isAdminUser = await isAdmin(user.id);
  
  if (!isAdminUser) {
    const userRole = await getUserRole(user.id);
    console.warn(`Admin access denied for user ${user.id} with role: ${userRole}`);
    throw new Error('Forbidden: Only admins can perform this action');
  }

  const userRole = await getUserRole(user.id);
  console.info(`Admin access granted for user: ${user.id}`);
  return { ...user, role: userRole || 'admin' };
}

// Helper function to check if user has specific role (bypasses RLS)
export async function getUserRole(userId: string): Promise<string | null> {
  // Check if Supabase client is available
  if (!supabaseAdmin) {
    console.warn('Supabase client not available. Cannot get user role.');
    return null;
  }

  try {
    // Try SQL function first (most reliable)
    const { data, error } = await supabaseAdmin
      .rpc('get_user_role', { user_id: userId });

    if (error) {
      console.error('Error getting user role via RPC:', error);
      
      // Fallback to direct query with admin client
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return null;
      }

      return fallbackData?.role || null;
    }

    return data || null;
  } catch (error) {
    console.error('Unexpected error getting user role:', error);
    return null;
  }
}

// Helper function to check if user is admin
export async function isAdmin(userId: string): Promise<boolean> {
  // Check if Supabase client is available
  if (!supabaseAdmin) {
    console.warn('Supabase client not available. Cannot check admin status.');
    return false;
  }

  try {
    const { data, error } = await supabaseAdmin
      .rpc('is_admin', { user_id: userId });

    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Unexpected error checking admin status:', error);
    return false;
  }
}

// Helper function to check if user is admin or editor
export async function isAdminOrEditor(userId: string): Promise<boolean> {
  // Check if Supabase client is available
  if (!supabaseAdmin) {
    console.warn('Supabase client not available. Cannot check admin/editor status.');
    return false;
  }

  try {
    const { data, error } = await supabaseAdmin
      .rpc('is_admin_or_editor', { user_id: userId });

    if (error) {
      console.error('Error checking admin/editor status:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Unexpected error checking admin/editor status:', error);
    return false;
  }
}
