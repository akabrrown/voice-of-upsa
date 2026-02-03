import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { sanitizeInput } from '@/lib/api/middleware/validation';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Validation schema using Zod
const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
});

// Rate limiting: 3 reset attempts per hour per IP/email
const rateLimitMiddleware = withRateLimit(3, 60 * 60 * 1000, (req) => 
  req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown'
);

// Input sanitization
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

  try {
    // Apply rate limiting
    rateLimitMiddleware(req);

    // Validate and sanitize input
    resetPasswordSchema.parse(req.body);
    const email = sanitizeInput(req.body.email);

    // Check if user exists first to give better feedback
    const supabaseAdminClient = await getSupabaseAdmin();
    if (!supabaseAdminClient) {
      console.error('Supabase admin client not available - check environment variables');
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Password reset service is temporarily unavailable',
          details: process.env.NODE_ENV === 'development' 
            ? 'Missing SUPABASE_SERVICE_ROLE_KEY environment variable' 
            : null
        },
        timestamp: new Date().toISOString()
      });
    }

    const { data: userData } = await (supabaseAdminClient as any).auth.admin.listUsers();
    const userExists = userData?.users?.some((u: { email?: string }) => u.email === email);

    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'No account found with this email address',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Send password reset email
    console.log('Attempting to send password reset email to:', email);
    
    const { error: resetError } = await supabaseAdminClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
    });

    // Always generate a recovery link in development for easier testing
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Generating fallback link');
      try {
        const { data: recoveryData, error: recoveryError } = await (supabaseAdminClient as any).auth.admin.generateLink({
          type: 'recovery',
          email: email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
          }
        });
        
        if (!recoveryError && recoveryData?.properties?.action_link) {
          console.log('🔗 DEVELOPMENT - Password Reset Link:', recoveryData.properties.action_link);
          
          return res.status(200).json({
            success: true,
            data: {
              message: 'Password reset instructions sent to your email',
              developmentLink: recoveryData.properties.action_link,
              note: 'In development, use this link if email is not received'
            },
            timestamp: new Date().toISOString()
          });
        }
      } catch (fallbackError) {
        console.error('Fallback link generation failed:', fallbackError);
      }
    }

    if (resetError) {
      // Log security event
      console.warn(`Password reset failure for email: ${email}`, {
        error: resetError.message,
        errorDetails: resetError,
        timestamp: new Date().toISOString(),
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
      });

      return res.status(400).json({
        success: false,
        error: {
          code: 'PASSWORD_RESET_FAILED',
          message: 'Password reset failed',
          details: resetError.message
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log successful password reset request
    console.info(`Password reset instructions sent for email: ${email}`, {
      timestamp: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Password reset instructions sent to your email'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while sending reset instructions',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Wrap with error handler middleware
export default withErrorHandler(handler);

