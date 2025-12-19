import { NextApiRequest } from 'next';
import { getSupabaseAdmin } from './database-server';

export async function verifySupabaseToken(token: string): Promise<string | null> {
  if (!token) {
    return null;
  }

  try {
    const supabaseAdmin = await getSupabaseAdmin();
    if (!supabaseAdmin) {
      return null;
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    return user.id;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function getUserFromToken(token: string): Promise<{ id: string; email?: string } | null> {
  if (!token) {
    return null;
  }

  try {
    const supabaseAdmin = await getSupabaseAdmin();
    if (!supabaseAdmin) {
      return null;
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    return {
      id: user.id,
      email: user.email
    };
  } catch (error) {
    console.error('User verification error:', error);
    return null;
  }
}

export async function requireRole(req: NextApiRequest, allowedRoles: string[]): Promise<{ id: string; email?: string; role: string }> {
  const supabaseAdmin = await getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not initialized');
  }
  
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No authorization token provided');
  }

  const user = await getUserFromToken(token);
  
  if (!user) {
    throw new Error('Invalid or expired token');
  }

  // Get user role from database
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    throw new Error('User not found in database');
  }

  const userRecord = userData as { role: string };

  if (!allowedRoles.includes(userRecord.role)) {
    throw new Error('Insufficient permissions');
  }

  return {
    ...user,
    role: userRecord.role
  };
}