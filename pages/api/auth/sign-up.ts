import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/database';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { sanitizeInput } from '@/lib/api/middleware/validation';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { withIPWhitelist } from '@/lib/security/ip-whitelist';
import { 
  SECURITY_CONFIG, 
  validatePasswordStrength, 
  validateEmailEnhanced, 
  generateDeviceFingerprint,
  getClientIP,
  detectSuspiciousActivity,
  logSecurityEvent,
  SecurityContext
} from '@/lib/security/auth-security';
import { z } from 'zod';

// Enhanced validation schema using Zod
const signUpSchema = z.object({
  email: z.string().email('Invalid email format').max(254, 'Email must not exceed 254 characters'),
  password: z.string()
    .min(SECURITY_CONFIG.passwordMinLength, `Password must be at least ${SECURITY_CONFIG.passwordMinLength} characters long`)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  fullName: z.string().min(1, 'Full name is required').max(255, 'Full name must not exceed 255 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
  bio: z.string().max(1000, 'Bio must not exceed 1000 characters').optional(),
  website: z.string().url('Invalid website URL').optional().nullable(),
  location: z.string().max(255, 'Location must not exceed 255 characters').optional().nullable()
});

// Enhanced rate limiting: 3 sign-up attempts per 30 minutes per IP
const rateLimitMiddleware = withRateLimit(3, 30 * 60 * 1000, (req) => 
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
    endpoint: '/api/auth/sign-up',
    email: req.body.email
  };

  try {
    // Apply rate limiting
    rateLimitMiddleware(req);

    // Detect suspicious activity
    const suspiciousCheck = detectSuspiciousActivity(securityContext);
    if (suspiciousCheck.isSuspicious) {
      logSecurityEvent('Suspicious sign-up attempt detected', securityContext, 'high', {
        reasons: suspiciousCheck.reasons,
        riskScore: suspiciousCheck.riskScore,
        deviceFingerprint
      });

      return res.status(429).json({
        success: false,
        error: {
          code: 'SUSPICIOUS_ACTIVITY',
          message: 'Your request has been flagged as suspicious. Please try again later.',
          details: 'Security checks failed'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate and sanitize input
    const validationResult = signUpSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => err.message);
      
      logSecurityEvent('Sign-up validation failed', securityContext, 'medium', {
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

    const { email, password, fullName, bio, website, location } = validationResult.data;

    // Enhanced email validation
    const emailValidation = validateEmailEnhanced(email);
    if (!emailValidation.isValid) {
      logSecurityEvent('Invalid email detected', securityContext, 'medium', {
        emailErrors: emailValidation.errors
      });

      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Email address is not valid or not allowed',
          details: emailValidation.errors
        },
        timestamp: new Date().toISOString()
      });
    }

    // Enhanced password validation
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      logSecurityEvent('Weak password attempt', securityContext, 'medium', {
        passwordScore: passwordValidation.score,
        passwordErrors: passwordValidation.errors
      });

      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password does not meet security requirements',
          details: passwordValidation.errors,
          passwordScore: passwordValidation.score
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log sign-up attempt
    logSecurityEvent('Sign-up attempt initiated', securityContext, 'low', {
      email,
      deviceFingerprint,
      passwordScore: passwordValidation.score
    });

    // Check if user already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingUser, error: checkError } = await (supabase as any)
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingUser && !checkError) {
      logSecurityEvent('Duplicate registration attempt', securityContext, 'medium', {
        existingUserId: existingUser.id
      });

      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'An account with this email already exists',
          details: 'Please use a different email address or try to sign in'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Create user with Supabase Auth
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: authData, error: authError } = await (supabase as any).auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: sanitizeInput(fullName),
          bio: bio ? sanitizeInput(bio) : null,
          website: website || null,
          location: location ? sanitizeInput(location) : null,
          device_fingerprint: deviceFingerprint,
          registration_ip: clientIP
        }
      }
    });

    if (authError) {
      // Log security event
      logSecurityEvent('Sign-up failure', securityContext, 'medium', {
        error: authError.message,
        errorType: authError.status?.toString()
      });

      return res.status(400).json({
        success: false,
        error: {
          code: 'SIGNUP_FAILED',
          message: 'Account creation failed',
          details: authError.message
        },
        timestamp: new Date().toISOString()
      });
    }

    if (authData.user) {
      // Create user profile in database with enhanced security fields
      const userProfile = {
        id: authData.user.id,
        email: authData.user.email,
        name: sanitizeInput(fullName),
        role: 'user',
        avatar_url: authData.user.user_metadata?.avatar_url || null,
        bio: bio ? sanitizeInput(bio) : null,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_sign_in: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileError } = await (supabase as any)
        .from('users')
        .insert(userProfile);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        logSecurityEvent('Profile creation failed', securityContext, 'high', {
          userId: authData.user.id,
          profileError: profileError.message
        });
      }


      // Log successful sign-up
      logSecurityEvent('Sign-up successful', securityContext, 'low', {
        userId: authData.user.id,
        email,
        deviceFingerprint,
        passwordScore: passwordValidation.score
      });
    }

    res.status(201).json({
      success: true,
      data: {
        message: 'User created successfully. Please check your email to verify your account.',
        user: {
          id: authData.user?.id,
          email: authData.user?.email,
          name: authData.user?.user_metadata?.full_name,
          email_verified: !!authData.user?.email_confirmed_at,
          security_level: passwordValidation.score >= 80 ? 'high' : passwordValidation.score >= 60 ? 'medium' : 'low'
        },
        session: authData.session ? {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_at: authData.session.expires_at
        } : null,
        security_info: {
          password_strength_score: passwordValidation.score,
          email_verification_required: SECURITY_CONFIG.enableEmailVerification
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sign-up error:', error);
    logSecurityEvent('Sign-up system error', securityContext, 'critical', {
      error: (error as Error).message,
      stack: (error as Error).stack
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during sign up',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Wrap with error handler and IP whitelist middleware
export default withErrorHandler(withIPWhitelist(handler, { adminOnly: false }));

