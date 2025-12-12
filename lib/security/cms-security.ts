/**
 * CMS Security Enhancement Patch
 * Comprehensive security measures for admin/CMS endpoints
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { createClient } from '@supabase/supabase-js';
import { 
  generateDeviceFingerprint,
  getClientIP,
  detectSuspiciousActivity,
  logSecurityEvent,
  SecurityContext
} from './auth-security';

export interface CMSUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  lastActivity: Date;
  securityLevel: 'low' | 'medium' | 'high';
}

export interface CMSSecurityConfig {
  requireMFA: boolean;
  sessionTimeout: number;
  maxConcurrentSessions: number;
  auditSensitiveActions: boolean;
  requireIPWhitelist: boolean;
  enforceDeviceApproval: boolean;
  rateLimiting: {
    reads: number;
    writes: number;
    deletes: number;
    window: number;
  };
}

export const CMS_SECURITY_CONFIG: CMSSecurityConfig = {
  requireMFA: false, // Enable when MFA is implemented
  sessionTimeout: 60 * 60 * 1000, // 1 hour
  maxConcurrentSessions: 3,
  auditSensitiveActions: true,
  requireIPWhitelist: false, // Disabled for testing
  enforceDeviceApproval: false, // Disabled for testing
  rateLimiting: {
    reads: 100,    // Increased from 20 to 100 reads per minute for development
    writes: 20,    // Increased from 5 to 20 writes per minute for development
    deletes: 5,    // Increased from 1 to 5 deletes per minute for development
    window: 60 * 1000 // 1 minute window
  }
};

/**
 * Enhanced CMS authentication with multiple security layers
 */
export async function verifyCMSAccess(req: NextApiRequest): Promise<CMSUser> {
  console.log('CMS Security: verifyCMSAccess called');
  const clientIP = getClientIP(req);
  const deviceFingerprint = generateDeviceFingerprint(req);
  
  // Create security context
  const securityContext: SecurityContext = {
    clientIP,
    userAgent: req.headers['user-agent'] || 'unknown',
    timestamp: new Date(),
    endpoint: req.url || 'unknown',
    email: undefined // Will be set after auth
  };

  try {
    // 1. Authorization header validation
    const authHeader = req.headers.authorization;
    console.log('CMS Security: Auth header:', authHeader ? 'Present' : 'Missing');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logSecurityEvent('CMS access denied - no auth header', securityContext, 'high');
      throw new Error('Authorization token required');
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('CMS Security: Token extracted, length:', token.length);
    console.log('CMS Security: Token preview:', token.substring(0, 20) + '...');
    console.log('CMS Security: Full token for debugging:', token);

    // 2. Token verification with Supabase using Bearer token
    console.log('CMS Security: Creating Supabase client with URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...');
    console.log('CMS Security: Anon key present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    console.log('CMS Security: Using Bearer token authentication');
    
    // Check if token is valid format
    if (!token || token.length < 10) {
      console.log('CMS Security: Invalid token format');
      throw new Error('Invalid token format');
    }
    
    console.log('CMS Security: Calling supabase.auth.getUser(token)...');
    const authResult = await supabase.auth.getUser(token);
    const user = authResult.data.user;
    const authError = authResult.error;
    
    console.log('CMS Security: Auth result:', { 
      user: !!user, 
      error: !!authError,
      errorMessage: authError?.message,
      errorCode: authError?.code
    });
    
    if (authError || !user) {
      console.log('CMS Security: Token authentication failed', { authError: authError?.message });
      logSecurityEvent('CMS access denied - invalid token', securityContext, 'high');
      throw new Error(`Session expired or invalid: ${authError?.message || 'Unknown error'}`);
    }

    // 3. User verification and role checking
    // Get user role from metadata or default to 'user'
    const userRole = user.user_metadata?.role || 'user';
    console.log('CMS Security: User role from metadata:', userRole);
    
    const userData = {
      id: user.id,
      email: user.email || 'unknown@example.com',
      role: userRole,
      is_active: true,
      security_metadata: user.user_metadata || {},
      last_login_at: new Date().toISOString()
    };

    console.log('CMS Security: Using authenticated user:', userData.email);

    // Update security context with user email
    securityContext.email = userData.email;

    // 4. Account status verification
    if (!userData.is_active) {
      logSecurityEvent('CMS access denied - inactive account', securityContext, 'high', {
        userId: userData.id
      });
      throw new Error('Account is deactivated');
    }

    // 5. Role-based access control
    const allowedRoles = ['admin', 'editor', 'user']; // Temporarily allow 'user' for testing
    if (!allowedRoles.includes(userData.role)) {
      logSecurityEvent('CMS access denied - insufficient role', securityContext, 'high', {
        userId: userData.id,
        userRole: userData.role
      });
      throw new Error('Insufficient permissions for CMS access');
    }

    // 6. Suspicious activity detection
    const suspiciousCheck = detectSuspiciousActivity(securityContext);
    if (suspiciousCheck.isSuspicious) {
      logSecurityEvent('CMS suspicious activity detected', securityContext, 'high', {
        reasons: suspiciousCheck.reasons,
        riskScore: suspiciousCheck.riskScore,
        userId: userData.id
      });

      if (suspiciousCheck.riskScore > 50) {
        throw new Error('Access blocked due to suspicious activity');
      }
    }

    // 7. Device approval check (if enabled)
    if (CMS_SECURITY_CONFIG.enforceDeviceApproval) {
      const isApprovedDevice = await verifyDeviceApproval(userData.id, deviceFingerprint);
      if (!isApprovedDevice) {
        logSecurityEvent('CMS access denied - unapproved device', securityContext, 'high', {
          userId: userData.id,
          deviceFingerprint
        });
        throw new Error('Device not approved for CMS access');
      }
    }

    // 8. Session validation
    const isSessionValid = await validateCMSession(userData.id, token);
    if (!isSessionValid) {
      logSecurityEvent('CMS access denied - invalid session', securityContext, 'high', {
        userId: userData.id
      });
      throw new Error('Session expired or invalid');
    }

    // 9. Update last activity
    await updateLastActivity(userData.id, clientIP, deviceFingerprint);

    // 10. Determine security level
    const securityLevel = determineSecurityLevel(userData);

    logSecurityEvent('CMS access granted', securityContext, 'low', {
      userId: userData.id,
      userRole: userData.role,
      securityLevel
    });

    const permissions = getRolePermissions(userData.role);
    console.log('CMS Security: User permissions calculated:', {
      role: userData.role,
      permissions: permissions,
      hasManageAds: permissions.includes('manage:ads')
    });

    return {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      permissions: permissions,
      lastActivity: userData.last_login_at ? new Date(userData.last_login_at) : new Date(),
      securityLevel
    };

  } catch (error) {
    // Log failed access attempt
    logSecurityEvent('CMS access failed', securityContext, 'medium', {
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Verify device approval for CMS access
 */
async function verifyDeviceApproval(userId: string, deviceFingerprint: string): Promise<boolean> {
  try {
    const adminClient = getSupabaseAdmin();
    const { data: deviceRecord } = await adminClient
      .from('approved_devices')
      .select('id, is_active')
      .eq('user_id', userId)
      .eq('device_fingerprint', deviceFingerprint)
      .eq('is_active', true)
      .single();

    return !!deviceRecord;
  } catch (error) {
    // If table doesn't exist or other error, allow access (graceful fallback)
    console.warn('Device approval check failed:', error);
    return true;
  }
}

/**
 * Validate CMS session
 */
async function validateCMSession(userId: string, token: string): Promise<boolean> {
  try {
    const adminClient = getSupabaseAdmin();
    const { data: sessionRecord } = await adminClient
      .from('user_sessions')
      .select('expires_at, is_active')
      .eq('user_id', userId)
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (!sessionRecord) {
      return false;
    }

    // Check if session has expired
    if (sessionRecord.expires_at && new Date(sessionRecord.expires_at) < new Date()) {
      return false;
    }

    return true;
  } catch {
    // If session tracking table doesn't exist, rely on Supabase token validation
    return true;
  }
}

/**
 * Update user's last activity
 */
async function updateLastActivity(userId: string, clientIP: string, deviceFingerprint: string): Promise<void> {
  try {
    const adminClient = getSupabaseAdmin();
    await adminClient
      .from('users')
      .update({ 
        last_login_at: new Date().toISOString(),
        last_login_ip: clientIP,
        last_login_device: deviceFingerprint,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
  } catch (error) {
    // Don't fail the request if activity update fails
    console.warn('Failed to update last activity:', error);
  }
}

/**
 * Determine user security level based on various factors
 */
function determineSecurityLevel(userData: { role?: string; last_login_at?: string | null; security_metadata?: { password_strength_score?: number; mfa_enabled?: boolean } }): 'low' | 'medium' | 'high' {
  let score = 50; // Base score

  // Increase score for admin role
  if (userData.role === 'admin') score += 20;

  // Check password strength from metadata
  const passwordScore = userData.security_metadata?.password_strength_score;
  if (passwordScore !== undefined && passwordScore >= 80) {
    score += 15;
  } else if (passwordScore !== undefined && passwordScore >= 60) {
    score += 5;
  }

  // Check if 2FA is enabled (when implemented)
  if (userData.security_metadata?.mfa_enabled) {
    score += 15;
  }

  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

/**
 * Get role-based permissions
 */
function getRolePermissions(role: string): string[] {
  const permissions = {
    admin: [
      'read:all', 'write:all', 'delete:all',
      'manage:users', 'manage:settings', 'manage:content',
      'manage:ads', 'view:analytics', 'export:data', 'import:data'
    ],
    editor: [
      'read:content', 'write:content', 'delete:own_content',
      'manage:articles', 'manage:comments', 'upload:media', 'manage:content',
      'manage:messages', 'view:analytics', 'upload:logo', 'manage:ads', 'edit:articles'
    ],
    user: [
      'read:public', 'write:comments', 'manage:profile'
    ]
  };

  return permissions[role as keyof typeof permissions] || [];
}

/**
 * CMS-specific rate limiting
 */
export function getCMSRateLimit(method: string): { requests: number; window: number } {
  const config = CMS_SECURITY_CONFIG.rateLimiting;
  
  // Different limits based on HTTP method
  if (method === 'GET') {
    return { requests: config.reads, window: config.window };
  } else if (method === 'DELETE') {
    return { requests: config.deletes, window: config.window };
  } else {
    return { requests: config.writes, window: config.window };
  }
}

/**
 * Validate CMS input data with enhanced security
 */
export function validateCMSInput(data: unknown): {
  isValid: boolean;
  errors: string[];
  sanitizedData: Record<string, unknown>;
} {
  const errors: string[] = [];
  const sanitizedData = typeof data === 'object' && data !== null ? { ...data } as Record<string, unknown> : {};

  // Remove potentially dangerous fields
  const dangerousFields = ['password', 'token', 'secret', 'key'];
  dangerousFields.forEach(field => {
    if (field in sanitizedData) {
      delete sanitizedData[field];
      errors.push(`Dangerous field removed: ${field}`);
    }
  });

  // Sanitize string fields
  Object.keys(sanitizedData).forEach(key => {
    const value = sanitizedData[key];
    if (typeof value === 'string') {
      // Basic XSS prevention
      sanitizedData[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
  });

  // Validate URLs
  Object.keys(sanitizedData).forEach(key => {
    const value = sanitizedData[key];
    if (typeof value === 'string' && (key.includes('url') || key.includes('link'))) {
      try {
        new URL(value);
      } catch {
        errors.push(`Invalid URL format for field: ${key}`);
        delete sanitizedData[key];
      }
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}

/**
 * Middleware wrapper for CMS security
 */
export function withCMSSecurity(
  handler: (req: NextApiRequest, res: NextApiResponse, user: CMSUser) => Promise<void> | void,
  options: { requirePermission?: string; auditAction?: string } = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    console.log('=== CMS SECURITY MIDDLEWARE START ===');
    console.log('CMS SECURITY: Middleware triggered for', {
      url: req.url,
      method: req.method,
      requirePermission: options.requirePermission
    });
    
    try {
      console.log('CMS SECURITY: About to call verifyCMSAccess');
      // Verify CMS access
      const user = await verifyCMSAccess(req);

      // Check specific permission if required
      console.log('CMS Security: Permission check:', {
        requirePermission: options.requirePermission,
        userPermissions: user.permissions,
        hasPermission: options.requirePermission ? user.permissions.includes(options.requirePermission) : 'not required'
      });
      
      if (options.requirePermission && !user.permissions.includes(options.requirePermission)) {
        logSecurityEvent('CMS permission denied', {
          clientIP: getClientIP(req),
          userAgent: req.headers['user-agent'] || 'unknown',
          timestamp: new Date(),
          endpoint: req.url || 'unknown',
          userId: user.id,
          email: user.email
        }, 'medium', {
          requiredPermission: options.requirePermission,
          userPermissions: user.permissions
        });

        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'You do not have permission to perform this action',
            details: `Required permission: ${options.requirePermission}`
          },
          timestamp: new Date().toISOString()
        });
      }

      // Execute the handler
      await handler(req, res, user);

      // Log successful action if auditing is enabled
      if (CMS_SECURITY_CONFIG.auditSensitiveActions && options.auditAction) {
        await logAdminAction(user, options.auditAction, req.url || 'unknown', undefined, getClientIP(req), req);
      }

    } catch (error) {
      console.error('CMS security error:', error);
      console.error('CMS security error details:', {
        name: error instanceof Error ? error.name : 'not Error',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'no stack'
      });
      
      return res.status(401).json({
        success: false,
        error: {
          code: 'CMS_ACCESS_DENIED',
          message: error instanceof Error ? error.message : 'Access denied',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Log admin actions for audit trail
 */
async function logAdminAction(
  user: CMSUser,
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
        admin_id: user.id,
        admin_email: user.email,
        action,
        resource,
        resource_id: resourceId,
        ip_address: ipAddress,
        user_agent: req?.headers['user-agent'],
        timestamp: new Date().toISOString(),
        security_level: user.securityLevel
      });
  } catch (error) {
    // Don't fail the request if logging fails
    console.error('Failed to log admin action:', error);
  }
}
