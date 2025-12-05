import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/database';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { sanitizeInput } from '@/lib/api/middleware/validation';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Validation schema using Zod
const signUpSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  fullName: z.string().min(1, 'Full name is required').max(255, 'Full name must not exceed 255 characters'),
  bio: z.string().max(1000, 'Bio must not exceed 1000 characters').optional(),
  website: z.string().url('Invalid website URL').optional().nullable(),
  location: z.string().max(255, 'Location must not exceed 255 characters').optional().nullable()
});

// Rate limiting: 5 sign-up attempts per 15 minutes per IP
const rateLimitMiddleware = withRateLimit(5, 15 * 60 * 1000, (req) => 
  req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown'
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

  try {
    // Apply rate limiting
    rateLimitMiddleware(req);

    // Validate and sanitize input
    signUpSchema.parse(req.body);
    const email = req.body.email;
    const password = req.body.password;
    const fullName = sanitizeInput(req.body.fullName);
    const bio = req.body.bio ? sanitizeInput(req.body.bio) : undefined;
    const website = req.body.website;
    const location = req.body.location ? sanitizeInput(req.body.location) : undefined;

    // Log sign-up attempt
    console.info(`Sign-up attempt for email: ${email}`, {
      timestamp: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    });

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          bio: bio || null,
          website: website || null,
          location: location || null,
        }
      }
    });

    if (authError) {
      // Log security event
      console.warn(`Sign-up failure for email: ${email}`, {
        error: authError.message,
        timestamp: new Date().toISOString(),
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
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
      // Create user profile in database with new schema
      const userProfile = {
        id: authData.user.id,
        email: authData.user.email,
        name: fullName,
        role: 'user',
        avatar_url: authData.user.user_metadata?.avatar_url || null,
        bio: bio || null,
        website: website || null,
        location: location || null,
        social_links: {},
        preferences: {},
        is_active: true,
        email_verified: authData.user.email_confirmed_at ? true : false,
        last_sign_in_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('users')
        .insert(userProfile);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail the request if profile creation fails, but log it
        // This allows the auth to succeed even if profile creation has issues
      }

      // Update last login time
      await supabase
        .from('users')
        .update({ 
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', authData.user.id);

      // Log successful sign-up
      console.info(`Successful sign-up for user: ${authData.user.id}`, {
        email,
        timestamp: new Date().toISOString(),
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
      });
    }

    res.status(201).json({
      success: true,
      data: {
        message: 'User created successfully',
        user: {
          id: authData.user?.id,
          email: authData.user?.email,
          name: authData.user?.user_metadata?.full_name,
          email_verified: !!authData.user?.email_confirmed_at
        },
        session: authData.session ? {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_at: authData.session.expires_at
        } : null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sign-up error:', error);
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

// Wrap with error handler middleware
export default withErrorHandler(handler);

