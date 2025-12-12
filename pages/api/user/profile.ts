import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { getCMSRateLimit } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { requireAuth } from '@/lib/auth-helpers';
import { z } from 'zod';

// Enhanced validation schema with security constraints
const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must not exceed 255 characters')
    .regex(/^[^<>]*$/, 'Name cannot contain HTML tags'),
  bio: z.string().max(1000, 'Bio must not exceed 1000 characters')
    .regex(/^[^<>]*$/, 'Bio cannot contain HTML tags').optional().nullable(),
  avatar_url: z.string().url('Invalid avatar URL').optional().nullable(),
  website: z.string().url('Invalid website URL').optional().nullable(),
  location: z.string().max(255, 'Location must not exceed 255 characters')
    .regex(/^[^<>]*$/, 'Location cannot contain HTML tags').optional().nullable(),
  social_links: z.record(z.string()).optional(),
  preferences: z.record(z.unknown()).optional()
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Server-side authentication check - allow any authenticated user to access their own profile
    const user = await requireAuth(req);

    console.log('Profile API - User authenticated:', user.email, 'Role:', user.role);

    // Apply rate limiting based on method
    const rateLimit = getCMSRateLimit(req.method || 'GET');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // GET - Fetch user profile
    if (req.method === 'GET') {
      console.log('Profile API - Fetching profile for user ID:', user.id);
      
      const result = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      let profile = result.data;
      const error = result.error;

      console.log('Profile API - Query result:', { profile, error });

      if (error) {
        console.error(`Profile fetch failed for user ${user.email}:`, error);
        
        // If profile doesn't exist, create one automatically
        if (error.code === 'PGRST116') { // PostgREST error for "not found"
          console.log(`Profile not found for user ${user.email}, creating new profile...`);
          
          const { data: newProfile, error: createError } = await supabaseAdmin
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              role: 'user',
              email_verified: user.email_confirmed_at ? true : false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('*')
            .single();

          if (createError) {
            console.error(`Failed to create profile for user ${user.email}:`, createError);
            return res.status(500).json({
              success: false,
              error: {
                code: 'PROFILE_CREATION_FAILED',
                message: 'Failed to create user profile',
                details: process.env.NODE_ENV === 'development' ? createError.message : null
              },
              timestamp: new Date().toISOString()
            });
          }

          console.log('Profile API - New profile created:', newProfile);
          profile = newProfile;
        } else {
          return res.status(404).json({
            success: false,
            error: {
              code: 'PROFILE_NOT_FOUND',
              message: 'Profile not found',
              details: process.env.NODE_ENV === 'development' ? error.message : null
            },
            timestamp: new Date().toISOString()
          });
        }
      }

      // Sanitize profile data
      const sanitizedProfile = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        website: profile.website,
        location: profile.location,
        social_links: profile.social_links,
        preferences: profile.preferences,
        email_verified: profile.email_verified,
        is_active: profile.is_active,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        // Remove sensitive fields
        last_login_at: undefined,
        last_sign_in_at: undefined
      };

      return res.status(200).json({
        success: true,
        data: { profile: sanitizedProfile },
        timestamp: new Date().toISOString()
      });
    }

    // PUT - Update user profile
    if (req.method === 'PUT') {
      // Validate input
      const validatedData = profileUpdateSchema.parse(req.body);

      // Update profile
      const { data: updatedProfile, error } = await supabaseAdmin
        .from('users')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select('*')
        .single();

      if (error) {
        console.error(`Profile update failed for user ${user.email}:`, error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'PROFILE_UPDATE_FAILED',
            message: 'Failed to update profile',
            details: process.env.NODE_ENV === 'development' ? error.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Sanitize updated profile
      const sanitizedUpdatedProfile = {
        id: updatedProfile.id,
        email: updatedProfile.email,
        name: updatedProfile.name,
        role: updatedProfile.role,
        avatar_url: updatedProfile.avatar_url,
        bio: updatedProfile.bio,
        website: updatedProfile.website,
        location: updatedProfile.location,
        social_links: updatedProfile.social_links,
        preferences: updatedProfile.preferences,
        email_verified: updatedProfile.email_verified,
        created_at: updatedProfile.created_at,
        updated_at: updatedProfile.updated_at
      };

      // Log profile update
      console.info(`Profile updated by user: ${user.email}`, {
        changes: validatedData,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { profile: sanitizedUpdatedProfile },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET and PUT methods are allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`User profile API error:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing profile request',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply error handler middleware only
export default withErrorHandler(handler);

                                        
