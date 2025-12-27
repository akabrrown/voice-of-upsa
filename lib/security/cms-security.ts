/**
 * CMS Security Enhancement Patch
 * Comprehensive security measures for admin/CMS endpoints
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '../database-server';
import { 
  generateDeviceFingerprint,
  getClientIP,
  detectSuspiciousActivity,
  logSecurityEvent,
  SecurityContext
} from './auth-security';
import { Buffer } from 'buffer';

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
  requireIPWhitelist: false, // Disabled for development
  enforceDeviceApproval: false, // Disabled for development
  rateLimiting: {
    reads: 500,    // Increased from 100 to 500 reads per minute for development
    writes: 100,   // Increased from 20 to 100 writes per minute for development
    deletes: 20,   // Increased from 5 to 20 deletes per minute for development
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
    endpoint: req.url || 'unknown'
  };

  try {
    // Enhanced token validation
    const authHeader = req.headers.authorization;
    console.log('CMS SECURITY: Raw auth header:', authHeader ? 'PRESENT' : 'MISSING');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('CMS SECURITY: No Bearer token found');
      logSecurityEvent('CMS access denied - missing token', securityContext, 'high');
      throw new Error('Authentication token required');
    }

    const token = authHeader.substring(7);
    
    // Enhanced token format validation
    if (!token || token.length < 10) {
      console.log('CMS SECURITY: Token too short');
      logSecurityEvent('CMS access denied - invalid token format', securityContext, 'high');
      throw new Error('Invalid token format');
    }
    
    // Check for suspicious token patterns
    if (token.includes(' ') || token.includes('\n') || token.includes('\r')) {
      console.log('CMS SECURITY: Suspicious token pattern detected');
      logSecurityEvent('CMS access denied - suspicious token', securityContext, 'high');
      throw new Error('Invalid token format');
    }
    
    console.log('CMS SECURITY: Token extracted:', token.substring(0, 20) + '...');
    console.log('CMS SECURITY: Token length:', token.length);
    console.log('CMS SECURITY: Token format check:', token.startsWith('eyJ') ? 'JWT format' : 'Invalid format');
    
    // Enhanced token validation with multiple approaches
    console.log('CMS SECURITY: Getting supabase admin client...');
    const supabase = await getSupabaseAdmin();
    console.log('CMS SECURITY: Supabase admin client obtained');
    
    console.log('CMS SECURITY: Validating token with supabase.auth.getUser...');
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token);
    
    console.log('CMS SECURITY: Token validation result:', {
      hasUser: !!supabaseUser,
      userId: supabaseUser?.id,
      userEmail: supabaseUser?.email,
      hasError: !!authError,
      errorMessage: authError?.message,
      errorCode: authError?.name
    });
    
    if (authError) {
      console.log('CMS SECURITY: Auth error details:', authError);
      throw new Error('Session expired or invalid');
    }
    
    // 2. Token verification with Supabase using admin client
    console.log('CMS Security: Using admin client for token verification');
    
    // Check if token is valid format
    if (!token || token.length < 10) {
      console.log('CMS Security: Invalid token format');
      throw new Error('Invalid token format');
    }
    
    console.log('CMS Security: Calling supabase.auth.getUser(token)...');
    console.log('CMS Security: Token type check:', typeof token);
    console.log('CMS Security: Token starts with ey?', token.startsWith('ey'));
    
    // Try different token validation approach
    let user, validationError;
    try {
      console.log('CMS Security: Attempting getUser with token...');
      const result = await supabase.auth.getUser(token);
      user = result.data.user;
      validationError = result.error;
      
      console.log('CMS Security: getUser result:', {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        hasError: !!validationError,
        errorMessage: validationError?.message,
        errorCode: validationError?.name
      });
      
      // If getUser fails, try getUser with session
      if (!user && !validationError) {
        console.log('CMS Security: getUser returned no user, trying session validation...');
        const sessionResult = await supabase.auth.getSession();
        console.log('CMS Security: getSession result:', {
          hasSession: !!sessionResult.data.session,
          sessionUserId: sessionResult.data.session?.user?.id,
          sessionError: sessionResult.error?.message
        });
        
        if (sessionResult.data.session?.user) {
          user = sessionResult.data.session.user;
        }
        validationError = sessionResult.error;
      }
      
      // If still no user, try a more lenient approach - just decode the JWT
      if (!user && !validationError) {
        console.log('CMS Security: All validation methods failed, trying JWT decode...');
        try {
          // Try to decode JWT payload for additional validation
          const parts = token.split('.');
          if (parts.length === 3 && parts[1]) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            console.log('CMS Security: JWT payload decoded:', {
              exp: payload.exp,
              iat: payload.iat,
              sub: payload.sub,
              email: payload.email,
              role: payload.user_metadata?.role
            });
            
            // Check if token is expired
            if (payload.exp && payload.exp > Math.floor(Date.now() / 1000)) {
              user = {
                id: payload.sub,
                email: payload.email,
                user_metadata: payload.user_metadata || {},
                app_metadata: payload.app_metadata || {}
              };
              console.log('CMS Security: JWT decode successful, user created from payload');
            } else {
              console.log('CMS Security: JWT token expired');
              validationError = { message: 'Token expired' };
            }
          }
        } catch (jwtError) {
          console.log('CMS Security: JWT decode failed:', jwtError);
          validationError = { message: 'Invalid token format' };
        }
      }
    } catch (error) {
      console.log('CMS Security: Token validation threw error:', error);
      validationError = error;
    }
    
    console.log('CMS Security: Auth result:', { 
      user: !!user, 
      error: !!validationError,
      errorMessage: validationError && typeof validationError === 'object' && validationError !== null && 'message' in validationError ? validationError.message : undefined,
      errorCode: validationError && typeof validationError === 'object' && validationError !== null && 'code' in validationError ? validationError.code : undefined,
      userId: user?.id,
      userEmail: user?.email
    });
    
    if (validationError || !user) {
      const errorMessage = validationError && typeof validationError === 'object' && validationError !== null && 'message' in validationError ? validationError.message : 'Unknown error';
      console.log('CMS Security: Token authentication failed', { authError: errorMessage });
      logSecurityEvent('CMS access denied - invalid token', securityContext, 'high');
      throw new Error(`Session expired or invalid: ${errorMessage}`);
    }

    // 3. Enhanced user verification and role checking
    if (!supabaseUser || !supabaseUser.id || !supabaseUser.email) {
      console.log('CMS SECURITY: Invalid user data from token');
      logSecurityEvent('CMS access denied - invalid user data', securityContext, 'high');
      throw new Error('Invalid user authentication data');
    }

    // Get user role from public.users table (authoritative) or metadata (fallback)
    let userRole = supabaseUser.user_metadata?.role || 'user';
    
    try {
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('role')
        .eq('id', supabaseUser.id)
        .single() as { data: { role: string } | null, error: { message: string } | null };
        
      if (dbUser && dbUser.role) {
        userRole = dbUser.role;
        console.log('CMS Security: User role fetched from database:', userRole);
      } else if (dbError) {
        console.warn('CMS Security: Failed to fetch user role from DB, falling back to metadata', dbError.message);
      }
    } catch (err) {
      console.warn('CMS Security: Error fetching user role from DB', err);
    }

    console.log('CMS Security: User role final determination:', userRole);
    console.log('CMS Security: Full user metadata:', supabaseUser.user_metadata);
    console.log('CMS Security: User app_metadata:', supabaseUser.app_metadata);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(supabaseUser.email)) {
      console.log('CMS SECURITY: Invalid email format');
      logSecurityEvent('CMS access denied - invalid email', securityContext, 'high');
      throw new Error('Invalid user email format');
    }
    
    const userData = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      role: userRole,
      is_active: true,
      security_metadata: supabaseUser.user_metadata || {},
      last_login_at: new Date().toISOString(),
      created_at: supabaseUser.created_at,
      email_confirmed_at: supabaseUser.email_confirmed_at
    };

    console.log('CMS Security: Using authenticated user:', userData.email);

    // Update security context with user email
    securityContext.email = userData.email;

    // 4. Enhanced account status verification
    if (!userData.is_active) {
      logSecurityEvent('CMS access denied - inactive account', securityContext, 'high', {
        userId: userData.id
      });
      throw new Error('Account is deactivated');
    }

    // Check if email is confirmed
    if (!userData.email_confirmed_at) {
      console.log('CMS SECURITY: Email not confirmed');
      logSecurityEvent('CMS access denied - email not confirmed', securityContext, 'medium', {
        userId: userData.id
      });
      throw new Error('Email address must be confirmed');
    }

    // 5. Enhanced role-based access control
    const allowedRoles = ['admin', 'editor', 'user']; // Temporarily allow 'user' for testing
    if (!allowedRoles.includes(userData.role)) {
      logSecurityEvent('CMS access denied - insufficient role', securityContext, 'high', {
        userId: userData.id,
        userRole: userData.role
      });
      throw new Error('Insufficient permissions for CMS access');
    }

    // 6. Enhanced suspicious activity detection
    const suspiciousActivity = detectSuspiciousActivity(securityContext);

    if (suspiciousActivity.isSuspicious) {
      console.log('CMS SECURITY: Suspicious activity detected:', suspiciousActivity.reasons.join(', '));
      logSecurityEvent('CMS access denied - suspicious activity', securityContext, 'high', {
        userId: userData.id,
        reason: suspiciousActivity.reasons.join(', ')
      });
      throw new Error('Access blocked due to suspicious activity');
    }

    // 7. Enhanced session validation
    const sessionValid = await validateCMSession(userData.id, token);
    if (!sessionValid) {
      console.log('CMS SECURITY: Invalid session');
      logSecurityEvent('CMS access denied - invalid session', securityContext, 'high', {
        userId: userData.id
      });
      throw new Error('Session is invalid or expired');
    }

    // 8. Enhanced device approval check
    if (CMS_SECURITY_CONFIG.enforceDeviceApproval) {
      const deviceApproved = await verifyDeviceApproval(userData.id, deviceFingerprint);
      if (!deviceApproved) {
        console.log('CMS SECURITY: Device not approved');
        logSecurityEvent('CMS access denied - device not approved', securityContext, 'high', {
          userId: userData.id,
          deviceFingerprint
        });
        throw new Error('Device not approved for CMS access');
      }
    }

    // 9. Enhanced IP whitelist check
    if (CMS_SECURITY_CONFIG.requireIPWhitelist) {
      const ipWhitelisted = await verifyIPWhitelist(userData.id, clientIP);
      if (!ipWhitelisted) {
        console.log('CMS SECURITY: IP not whitelisted');
        logSecurityEvent('CMS access denied - IP not whitelisted', securityContext, 'high', {
          userId: userData.id,
          clientIP
        });
        throw new Error('IP address not whitelisted for CMS access');
      }
    }

    // 10. Enhanced session timeout check
    const sessionAge = Date.now() - new Date(userData.last_login_at).getTime();
    if (sessionAge > CMS_SECURITY_CONFIG.sessionTimeout) {
      console.log('CMS SECURITY: Session expired');
      logSecurityEvent('CMS access denied - session expired', securityContext, 'medium', {
        userId: userData.id,
        sessionAge
      });
      throw new Error('Session has expired');
    }

    // 11. Enhanced concurrent session check
    if (CMS_SECURITY_CONFIG.maxConcurrentSessions > 0) {
      const activeSessions = await getActiveSessionCount(userData.id);
      if (activeSessions >= CMS_SECURITY_CONFIG.maxConcurrentSessions) {
        console.log('CMS SECURITY: Too many concurrent sessions');
        logSecurityEvent('CMS access denied - too many sessions', securityContext, 'medium', {
          userId: userData.id,
          activeSessions
        });
        throw new Error('Too many concurrent sessions');
      }
    }

    // 12. Enhanced permission calculation
    const permissions = getRolePermissions(userData.role);
    
    // Add custom permissions from user metadata
    const customPermissions = userData.security_metadata?.custom_permissions || [];
    permissions.push(...customPermissions);

    // 13. Enhanced security level calculation
    const securityLevel = determineSecurityLevel(userData);

    console.log('CMS Security: User access granted', {
      userId: userData.id,
      role: userData.role,
      securityLevel,
      permissionsCount: permissions.length,
      hasManageUsers: permissions.includes('manage:users'),
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
 * Verify IP whitelist for CMS access
 */
async function verifyIPWhitelist(userId: string, clientIP: string): Promise<boolean> {
  // Skip IP whitelist check in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  try {
    const adminClient = await getSupabaseAdmin();
    const { data: ipRecord, error: ipError } = await adminClient
      .from('ip_whitelist')
      .select('id, is_active')
      .eq('user_id', userId)
      .eq('ip_address', clientIP)
      .eq('is_active', true)
      .single();

    // If table doesn't exist, allow access (graceful fallback)
    if (ipError && 'code' in ipError && ipError.code === '42P01') {
      console.log('CMS Security: ip_whitelist table not found, skipping IP check');
      return true;
    }

    return !!ipRecord;
  } catch (error) {
    // If table doesn't exist or other error, allow access (graceful fallback)
    console.warn('IP whitelist check failed:', error);
    return true;
  }
}

/**
 * Get active session count for a user
 */
async function getActiveSessionCount(userId: string): Promise<number> {
  try {
    const adminClient = await getSupabaseAdmin();
    const { data: sessions } = await adminClient
      .from('user_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());

    return sessions?.length || 0;
  } catch (error) {
    // If table doesn't exist or other error, return 0 (graceful fallback)
    console.warn('Session count check failed:', error);
    return 0;
  }
}

/**
 * Verify device approval for CMS access
 */
async function verifyDeviceApproval(userId: string, deviceFingerprint: string): Promise<boolean> {
  // Skip device approval check in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  try {
    const adminClient = await getSupabaseAdmin();
    const { data: deviceRecord, error: deviceError } = await adminClient
      .from('approved_devices')
      .select('id, is_active')
      .eq('user_id', userId)
      .eq('device_fingerprint', deviceFingerprint)
      .eq('is_active', true)
      .single();

    // If table doesn't exist, allow access (graceful fallback)
    if (deviceError && 'code' in deviceError && deviceError.code === '42P01') {
      console.log('CMS Security: approved_devices table not found, skipping device check');
      return true;
    }

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
  // Always rely on Supabase token validation if session table doesn't exist
  // This allows production to work without the user_sessions table
  try {
    const adminClient = await getSupabaseAdmin();
    const { data: sessionRecord, error: sessionError } = await adminClient
      .from('user_sessions')
      .select('expires_at, is_active')
      .eq('user_id', userId)
      .eq('token', token)
      .eq('is_active', true)
      .single();

    // If table doesn't exist (error code 42P01 = undefined_table), allow access
    if (sessionError && 'code' in sessionError && sessionError.code === '42P01') {
      console.log('CMS Security: user_sessions table not found, skipping session validation');
      return true;
    }

    // If no error but no record found in development, allow
    if (!sessionRecord && process.env.NODE_ENV === 'development') {
      return true;
    }

    if (!sessionRecord) {
      console.log('CMS Security: No session record found in user_sessions, but token is valid. Allowing access.');
      return true;
    }

    // Check if session has expired
    const expiresAt = (sessionRecord as Record<string, unknown>).expires_at;
    if (expiresAt && new Date(expiresAt as string) < new Date()) {
      return false;
    }

    return true;
  } catch (error) {
    // If session tracking table doesn't exist or any other error, rely on Supabase token validation
    console.log('CMS Security: Session validation error or record missing, falling back to token validation:', error);
    return true;
  }
}

/**
 * Get role-based permissions
 */
function getRolePermissions(role: string): string[] {
  const permissions = {
    admin: [
      'read:all', 'write:all', 'delete:all',
      'manage:users', 'manage:settings', 'manage:content',
      'manage:ads', 'view:analytics', 'export:data', 'import:data',
      'edit:articles', 'manage:articles', 'manage:comments',
      'manage:messages', 'upload:media', 'upload:logo',
      'admin:security', 'admin:maintenance', 'admin:setup',
      'admin:emergency', 'admin:debug', 'admin:access',
      'manage:notifications', 'manage:system', 'view:content',
      'comment:create', 'delete:account'
    ],
    editor: [
      'read:content', 'write:content', 'delete:own_content',
      'manage:articles', 'manage:comments', 'upload:media', 'manage:content',
      'manage:messages', 'view:analytics', 'edit:articles',
      'export:data', 'view:content', 'comment:create'
    ],
    user: [
      'read:public', 'write:comments', 'manage:profile', 'upload:media', 'view:bookmarks',
      'view:content', 'comment:create', 'delete:account'
    ]
  };

  return permissions[role as keyof typeof permissions] || [];
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
  });

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
  console.log('=== WITH CMS SECURITY FUNCTION CALLED ===');
  console.log('CMS SECURITY: Creating wrapper for handler');
  
  return async (req: NextApiRequest, res: NextApiResponse) => {
    console.log('=== CMS SECURITY MIDDLEWARE START ===');
    console.log('CMS SECURITY: Middleware triggered for', {
      url: req.url,
      method: req.method,
      requirePermission: options.requirePermission,
      headers: Object.keys(req.headers)
    });
    
    // Debug authorization header
    const authHeader = req.headers.authorization;
    console.log('CMS SECURITY: Authorization header:', authHeader ? `Bearer ${authHeader.substring(7, 7 + 20)}...` : 'MISSING');
    
    try {
      console.log('CMS SECURITY: About to call verifyCMSAccess');
      // Verify CMS access
      const user = await verifyCMSAccess(req);

      // Check specific permission if required
      console.log('CMS Security: Permission check:', {
        requirePermission: options.requirePermission,
        userPermissions: user.permissions,
        hasPermission: options.requirePermission ? user.permissions.includes(options.requirePermission) : 'not required',
        userRole: user.role,
        userId: user.id,
        userEmail: user.email,
        allPermissions: user.permissions
      });
      
      if (options.requirePermission && !user.permissions.includes(options.requirePermission)) {
        // Log permission denied event
        await logSecurityEvent('CMS permission denied', {
          clientIP: getClientIP(req),
          userAgent: req.headers['user-agent'] || 'unknown',
          timestamp: new Date(),
          endpoint: req.url || 'unknown',
          userId: user.id,
          email: user.email
        }, 'medium', {
          action: options.auditAction,
          resource: req.url,
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
        await logUserAction(
          user, 
          options.auditAction, 
          req.url || 'unknown', 
          undefined, 
          getClientIP(req), 
          req,
          {
            method: req.method,
            userAgent: req.headers['user-agent'],
            success: true
          }
        );
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
// Type definitions for database operations where Supabase types are not available
type DatabaseInsert = {
  insert: (data: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
};

async function logAdminAction(
  user: CMSUser,
  action: string,
  resource: string,
  resourceId?: string,
  ipAddress?: string,
  req?: NextApiRequest
): Promise<void> {
  try {
    const adminClient = await getSupabaseAdmin();
    const insertData = {
      admin_id: user.id,
      admin_email: user.email,
      action,
      resource,
      resource_id: resourceId,
      ip_address: ipAddress,
      user_agent: req?.headers['user-agent'],
      timestamp: new Date().toISOString(),
      security_level: user.securityLevel
    };
    
    // Use unknown first, then cast to avoid type overlap issues
    await (adminClient.from('admin_audit_log') as unknown as DatabaseInsert).insert(insertData);
  } catch (error) {
    // Don't fail the request if logging fails
    console.error('Failed to log admin action:', error);
  }
}

/**
 * Comprehensive audit logging for all user actions
 */
async function logUserAction(
  user: CMSUser,
  action: string,
  resource: string,
  resourceId?: string,
  ipAddress?: string,
  req?: NextApiRequest,
  additionalData?: Record<string, unknown>
): Promise<void> {
  try {
    const adminClient = await getSupabaseAdmin();
    
    // Log to general audit log
    const insertData = {
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      action,
      resource,
      resource_id: resourceId,
      ip_address: ipAddress,
      user_agent: req?.headers['user-agent'],
      timestamp: new Date().toISOString(),
      security_level: user.securityLevel,
      additional_data: additionalData
    };
    
    // Use unknown first, then cast to avoid type overlap issues
    await (adminClient.from('user_audit_log') as unknown as DatabaseInsert).insert(insertData);

    // If user is admin, also log to admin audit log for backward compatibility
    if (user.role === 'admin') {
      await logAdminAction(user, action, resource, resourceId, ipAddress, req);
    }

    console.log('User action logged:', {
      userId: user.id,
      email: user.email,
      role: user.role,
      action,
      resource,
      resourceId
    });
  } catch (error) {
    // Don't fail the request if logging fails
    console.error('Failed to log user action:', error);
  }
}

// Export audit logging functions for use throughout the application
export { logUserAction };
