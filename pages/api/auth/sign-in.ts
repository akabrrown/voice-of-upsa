import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/database';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { sanitizeInput } from '@/lib/api/middleware/validation';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Validation schema
const signInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

// Rate limiting: 5 sign-in attempts per 15 minutes per IP
const rateLimitMiddleware = withRateLimit(5, 15 * 60 * 1000, (req) => 
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
    signInSchema.parse(req.body);
    const email = sanitizeInput(req.body.email);
    const { password } = req.body;

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Log security event
      console.warn(`Authentication failure for email: ${email}`, {
        error: error.message,
        timestamp: new Date().toISOString(),
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
      });

      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Invalid email or password',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log successful authentication
    console.info(`Successful authentication for user: ${data.user?.id}`, {
      email,
      timestamp: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Sign in successful',
        user: {
          id: data.user?.id,
          email: data.user?.email,
          name: data.user?.user_metadata?.name,
          avatar_url: data.user?.user_metadata?.avatar_url
        },
        session: {
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
          expires_at: data.session?.expires_at
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sign-in error:', error);
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

// Wrap with validation middleware
export default withErrorHandler(handler);

