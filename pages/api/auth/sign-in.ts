import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/database';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { sanitizeInput } from '@/lib/api/middleware/validation';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { 
  SECURITY_CONFIG, 
  generateDeviceFingerprint,
  getClientIP,
  detectSuspiciousActivity,
  logSecurityEvent,
  isIPLockedOut,
  recordFailedAttempt,
  clearFailedAttempts,
  SecurityContext
} from '@/lib/security/auth-security';
import { z } from 'zod';

// Enhanced validation schema
const signInSchema = z.object({
  email: z.string().email('Invalid email format').max(254, 'Email must not exceed 254 characters'),
  password: z.string().min(1, 'Password is required')
});

// Enhanced rate limiting: 5 sign-in attempts per 15 minutes per IP
const rateLimitMiddleware = withRateLimit(5, 15 * 60 * 1000, (req) => 
  getClientIP(req)
);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  const clientIP = getClientIP(req);
  const deviceFingerprint = generateDeviceFingerprint(req);
  
  // Create security context
  const securityContext: SecurityContext = {
    clientIP,
    userAgent: req.headers['user-agent'] || 'unknown',
    timestamp: new Date(),
    endpoint: '/api/auth/sign-in',
    email: req.body.email
  };

  try {
    // Check if IP is locked out
    if (isIPLockedOut(clientIP)) {
      logSecurityEvent('Blocked login attempt - IP locked out', securityContext, 'high', {
        deviceFingerprint
      });

      return res.status(429).json({
        success: false,
        error: {
          code: 'IP_LOCKED_OUT',
          message: 'Too many failed attempts. Please try again later.',
          details: `Account locked for ${SECURITY_CONFIG.lockoutDuration / 60000} minutes`
        },
        timestamp: new Date().toISOString()
      });
    }

    // Apply rate limiting
    rateLimitMiddleware(req);

    // Detect suspicious activity
    const suspiciousCheck = detectSuspiciousActivity(securityContext);
    if (suspiciousCheck.isSuspicious) {
      logSecurityEvent('Suspicious sign-in attempt detected', securityContext, 'high', {
        reasons: suspiciousCheck.reasons,
        riskScore: suspiciousCheck.riskScore,
        deviceFingerprint
      });

      // For high suspicious activity, we might want to add additional verification
      if (suspiciousCheck.riskScore > 50) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'SUSPICIOUS_ACTIVITY',
            message: 'Your request has been flagged as suspicious. Please verify your identity or try again later.',
            details: 'Additional verification required'
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    // Validate and sanitize input
    const validationResult = signInSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => err.message);
      
      logSecurityEvent('Sign-in validation failed', securityContext, 'medium', {
        validationErrors: errors
      });

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid input data',
          details: errors
        },
        timestamp: new Date().toISOString()
      });
    }

    const { email, password } = validationResult.data;
    const sanitizedEmail = sanitizeInput(email);

    // Log sign-in attempt
    logSecurityEvent('Sign-in attempt initiated', securityContext, 'low', {
      email: sanitizedEmail,
      deviceFingerprint
    });

    // Check if user exists and get their security metadata (use admin client to bypass RLS)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, is_active, security_metadata, last_login_at, failed_login_attempts')
      .eq('email', sanitizedEmail)
      .single();

    if (userError || !userData) {
      // Record failed attempt
      const attemptResult = recordFailedAttempt(clientIP);
      
      logSecurityEvent('Sign-in failed - user not found', securityContext, 'medium', {
        email: sanitizedEmail,
        remainingAttempts: attemptResult.remainingAttempts,
        deviceFingerprint
      });

      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Invalid email or password',
          details: attemptResult.isLockedOut ? 
            `Account locked for ${SECURITY_CONFIG.lockoutDuration / 60000} minutes` : 
            `You have ${attemptResult.remainingAttempts} attempts remaining`
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if user account is active
    if (!userData.is_active) {
      logSecurityEvent('Sign-in failed - account inactive', securityContext, 'medium', {
        userId: userData.id,
        email: sanitizedEmail
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Your account has been deactivated. Please contact support.',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password,
    });

    if (error) {
      // Record failed attempt
      const attemptResult = recordFailedAttempt(clientIP);
      
      logSecurityEvent('Authentication failure', securityContext, 'medium', {
        error: error.message,
        errorType: error.status?.toString(),
        userId: userData.id,
        email: sanitizedEmail,
        remainingAttempts: attemptResult.remainingAttempts,
        deviceFingerprint
      });

      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Invalid email or password',
          details: attemptResult.isLockedOut ? 
            `Account locked for ${SECURITY_CONFIG.lockoutDuration / 60000} minutes` : 
            `You have ${attemptResult.remainingAttempts} attempts remaining`
        },
        timestamp: new Date().toISOString()
      });
    }

    // Clear failed attempts on successful authentication
    clearFailedAttempts(clientIP);

    // Update user's login information and security metadata
    const now = new Date().toISOString();
    const updatedSecurityMetadata = {
      ...userData.security_metadata,
      last_login_ip: clientIP,
      last_login_device_fingerprint: deviceFingerprint,
      last_login_at: now,
      successful_logins: (userData.security_metadata?.successful_logins || 0) + 1
    };

    await supabaseAdmin
      .from('users')
      .update({ 
        last_login_at: now,
        last_login_ip: clientIP,
        security_metadata: updatedSecurityMetadata,
        updated_at: now
      })
      .eq('id', userData.id);

    // Check for new device/location login
    const isNewDevice = userData.security_metadata?.last_login_device_fingerprint !== deviceFingerprint;
    const isNewLocation = userData.security_metadata?.last_login_ip !== clientIP;

    if (isNewDevice || isNewLocation) {
      logSecurityEvent('Sign-in from new device/location', securityContext, 'medium', {
        userId: userData.id,
        email: sanitizedEmail,
        isNewDevice,
        isNewLocation,
        previousDevice: userData.security_metadata?.last_login_device_fingerprint,
        previousIP: userData.security_metadata?.last_login_ip
      });

      // In a production environment, you might want to send an email notification here
    }

    // Log successful authentication
    logSecurityEvent('Sign-in successful', securityContext, 'low', {
      userId: userData.id,
      email: sanitizedEmail,
      deviceFingerprint,
      isNewDevice,
      isNewLocation
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Sign in successful',
        user: {
          id: data.user?.id,
          email: data.user?.email,
          name: data.user?.user_metadata?.full_name,
          avatar_url: data.user?.user_metadata?.avatar_url,
          security_level: userData.security_metadata?.security_level || 'medium'
        },
        session: {
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          expires_at: data.session?.expires_at
        },
        security_info: {
          session_timeout: SECURITY_CONFIG.sessionTimeout,
          new_device_detected: isNewDevice,
          new_location_detected: isNewLocation
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sign-in error:', error);
    logSecurityEvent('Sign-in system error', securityContext, 'critical', {
      error: (error as Error).message,
      stack: (error as Error).stack
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during sign in',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Wrap with error handler only (temporarily disabled IP whitelist for debugging)
export default withErrorHandler(handler);

