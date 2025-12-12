import { createClient } from '@supabase/supabase-js';
import { NextApiRequest } from 'next';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function requireAuth(req: NextApiRequest) {
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
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) throw new Error('No authentication token');

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) throw new Error('Invalid authentication token');

  // Use helper function to check admin/editor status
  const hasAccess = await isAdminOrEditor(user.id);
  
  if (!hasAccess) {
    const userRole = await getUserRole(user.id);
    console.warn(`Access denied for user ${user.id} with role: ${userRole}`);
    throw new Error('Forbidden: Only admins and editors can perform this action');
  }

  const userRole = await getUserRole(user.id);
  console.info(`Access granted for ${userRole}: ${user.id}`);
  return { ...user, role: userRole || 'unknown' };
}

export async function requireAdmin(req: NextApiRequest) {
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

  console.info(`Admin access granted: ${user.id}`);
  return { ...user, role: 'admin' };
}

// Helper function to check if user has specific role (bypasses RLS)
export async function getUserRole(userId: string): Promise<string | null> {
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
