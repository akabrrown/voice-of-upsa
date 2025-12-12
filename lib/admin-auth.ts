import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from './database-server';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Enhanced admin verification with multiple security checks
 */
export async function verifyAdmin(req: NextApiRequest): Promise<AdminUser> {
  // Check for authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided');
  }

  const token = authHeader.replace('Bearer ', '');

  // Verify token with Supabase
  const adminClient = getSupabaseAdmin();
  const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
  
  if (authError || !user) {
    throw new Error('Invalid or expired authentication token');
  }

  // Get user role from database with additional verification
  const { data: userData, error: userError } = await adminClient
    .from('users')
    .select('id, email, role, status')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    throw new Error('User not found in database');
  }

  // Verify user status
  if (userData.status !== 'active') {
    throw new Error('User account is not active');
  }

  // Verify admin role
  if (userData.role !== 'admin') {
    throw new Error('Insufficient permissions - admin role required');
  }

  // Additional security: Check if user has recent activity (optional)
  const { data: recentActivity } = await adminClient
    .from('user_sessions')
    .select('last_activity')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!recentActivity) {
    // Log this potential security issue
    console.warn(`Admin user ${user.id} accessed admin endpoint without active session`);
    // Don't block access, but log for security monitoring
  }

  return {
    id: userData.id,
    email: userData.email,
    role: userData.role
  };
}

/**
 * Middleware wrapper for admin verification
 */
export function withAdminAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, admin: AdminUser) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const admin = await verifyAdmin(req);
      return handler(req, res, admin);
    } catch (error) {
      console.error('Admin authentication error:', error);
      
      return res.status(401).json({
        success: false,
        error: {
          code: 'ADMIN_AUTH_FAILED',
          message: error instanceof Error ? error.message : 'Authentication failed',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Verify specific admin permissions
 */
export async function verifyAdminPermission(
  req: NextApiRequest
): Promise<AdminUser> {
  const admin = await verifyAdmin(req);
  
  // You can extend this with a more granular permission system
  // For now, all admins have all permissions
  
  return admin;
}

/**
 * Log admin actions for security auditing
 */
export async function logAdminAction(
  admin: AdminUser,
  action: string,
  resource: string,
  resourceId?: string,
  ipAddress?: string,
  req?: NextApiRequest
): Promise<void> {
  try {
    const adminClient = getSupabaseAdmin();
    await adminClient
      .from('admin_audit_log')
      .insert({
        admin_id: admin.id,
        admin_email: admin.email,
        action,
        resource,
        resource_id: resourceId,
        ip_address: ipAddress,
        user_agent: req?.headers['user-agent'],
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    // Don't fail the request if logging fails, but log the error
    console.error('Failed to log admin action:', error);
  }
}
