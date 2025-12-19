import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/database-server';
import { withErrorHandler } from '../../../lib/api/middleware/error-handler';
// import { withCMSSecurity } from '../../../lib/security/cms-security';
// import { getClientIP } from '../../../lib/security/auth-security';
// import { withRateLimit } from '../../../lib/api/middleware/auth';
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

// Define proper types for user with metadata
interface UserWithMetadata {
  id: string;
  email: string;
  role?: string;
  user_metadata?: {
    full_name?: string;
  };
  email_confirmed_at?: string;
}

// Define ProfileData interface for database results
interface ProfileData {
  id: string;
  user_id: string;
  email: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  location: string | null;
  social_links: Record<string, string>;
  preferences: Record<string, unknown>;
  is_public: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== PROFILE API HANDLER START ===');
  
  // Get authorization header
  const authHeader = req.headers.authorization;
  console.log('Profile API - Auth header:', authHeader ? 'Present' : 'Missing');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Profile API - No authorization header or invalid format');
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authorization required',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  const token = authHeader.substring(7);
  console.log('Profile API - Token extracted, validating...');
  
  let user: UserWithMetadata;
  
  try {
    const admin = await supabaseAdmin;
    const { data: { user: authUser }, error } = await admin.auth.getUser(token);
    
    if (error) {
      console.error('Profile API - Token validation error:', error);
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Authentication expired - please sign in again',
          details: process.env.NODE_ENV === 'development' ? error.message : null
        },
        timestamp: new Date().toISOString()
      });
    }
    
    if (!authUser) {
      console.error('Profile API - No user found for token');
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found - please sign in again',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Get user role from users table
    let userRole = 'user'; // default
    try {
      const admin = await supabaseAdmin;
      const { data, error } = await admin
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single();
      
      if (!error && data) {
        // Type assertion to bypass Supabase's complex type inference
        const userData = data as { role: string };
        userRole = userData.role;
        console.log('Profile API - User role from users table:', userRole);
      } else if (error) {
        console.log('Profile API - Error fetching user role, using default:', error.message);
      }
    } catch (roleError) {
      console.log('Profile API - Exception fetching user role, using default:', roleError);
    }

    user = {
      id: authUser.id,
      email: authUser.email!,
      role: userRole, // Use actual role from users table
      user_metadata: authUser.user_metadata || {},
      email_confirmed_at: authUser.email_confirmed_at || undefined
    };
    
    console.log('Profile API - User authenticated successfully:', user.email);

  } catch (authError) {
    console.error('Profile API - Authentication error:', authError);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
        details: process.env.NODE_ENV === 'development' ? (authError as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
  
  console.log('Profile API - User authenticated:', user.email, 'Role:', user.role);
  console.log('Profile API - User ID:', user.id, 'Email confirmed:', user.email_confirmed_at);
  console.log('Profile API - Request method:', req.method);
  console.log('=== PROFILE API HANDLER AUTHENTICATION PASSED ===');
  
  try {
    console.log('=== PROFILE API STARTING OPERATIONS ===');
    
    // Skip rate limiting for debugging
    // const rateLimitMiddleware = withRateLimit(100, 60 * 1000, (req: NextApiRequest) => 
    //   getClientIP(req)
    // );
    // rateLimitMiddleware(req);

    // GET - Fetch user profile
    if (req.method === 'GET') {
      console.log('Profile API - Fetching profile for user ID:', user.id);
      
      let admin;
      try {
        admin = await import('../../../lib/database-server').then(m => m.getSupabaseAdmin());
        console.log('Profile API - Supabase admin client initialized successfully');
      } catch (adminError) {
        console.error('Profile API - Failed to initialize Supabase admin:', adminError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_CONNECTION_FAILED',
            message: 'Failed to connect to database',
            details: process.env.NODE_ENV === 'development' ? (adminError as Error).message : null
          },
          timestamp: new Date().toISOString()
        });
      }
      
      let profileData, error;
      try {
        console.log('Profile API - Querying user_profiles for user:', user.id);
        const result = await admin
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        profileData = result.data;
        error = result.error;
        console.log('Profile API - Query completed. Data:', profileData ? 'Found' : 'Not found', 'Error:', error ? error.message : 'None');
      } catch (queryError) {
        console.error('Profile API - Database query failed:', queryError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_QUERY_FAILED',
            message: 'Failed to query database',
            details: process.env.NODE_ENV === 'development' ? (queryError as Error).message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      let profile = profileData;

      if (error) {
        console.error(`Profile fetch failed for user ${user.email}:`, error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // If profile doesn't exist, create one automatically
        if (error.code === 'PGRST116' || error.message?.includes('No rows found')) { // PostgREST error for "not found"
          console.log(`Profile not found for user ${user.email}, creating new profile...`);
          
          let newProfile, createError;
          try {
            const result = await admin
              .from('user_profiles')
              // @ts-expect-error - TypeScript inference issue with Supabase insert operation
              .insert({
                user_id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                bio: null,
                avatar_url: null,
                website: null,
                location: null,
                social_links: {},
                preferences: {},
                is_public: false,
                email_verified: user.email_confirmed_at ? true : false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select('*')
              .single();
            newProfile = result.data;
            createError = result.error;
          } catch (insertError) {
            console.error(`Profile insertion failed for user ${user.email}:`, insertError);
            return res.status(500).json({
              success: false,
              error: {
                code: 'PROFILE_INSERTION_FAILED',
                message: 'Failed to insert user profile',
                details: process.env.NODE_ENV === 'development' ? (insertError as Error).message : null
              },
              timestamp: new Date().toISOString()
            });
          }

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
          console.error(`Unexpected profile error for user ${user.email}:`, error);
          return res.status(500).json({
            success: false,
            error: {
              code: 'PROFILE_FETCH_FAILED',
              message: 'Failed to fetch user profile',
              details: process.env.NODE_ENV === 'development' ? error.message : null
            },
            timestamp: new Date().toISOString()
          });
        }
      }

      // Sanitize profile data to match AccountSettings interface
      const sanitizedProfile = {
        id: (profile as unknown as ProfileData)?.id,
        email: (profile as unknown as ProfileData)?.email,
        name: (profile as unknown as ProfileData)?.name,
        role: user.role, // Use actual user role
        avatar_url: (profile as unknown as ProfileData)?.avatar_url,
        bio: (profile as unknown as ProfileData)?.bio,
        website: (profile as unknown as ProfileData)?.website,
        location: (profile as unknown as ProfileData)?.location,
        social_links: (profile as unknown as ProfileData)?.social_links || {},
        preferences: (profile as unknown as ProfileData)?.preferences || {},
        is_active: true, // Default to active since user_profiles doesn't track this
        last_login_at: null,
        email_verified: (profile as unknown as ProfileData)?.email_verified || false,
        last_sign_in_at: null,
        created_at: (profile as unknown as ProfileData)?.created_at,
        updated_at: (profile as unknown as ProfileData)?.updated_at,
        article_count: 0,
        comment_count: 0,
        total_views: 0,
        total_likes: 0
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
      const admin = await import('../../../lib/database-server').then(m => m.getSupabaseAdmin());
      
      const { data: updatedProfile, error } = await admin
        .from('user_profiles')
        // @ts-expect-error - TypeScript inference issue with Supabase update operation
        .update({
          name: validatedData.name,
          avatar_url: validatedData.avatar_url,
          bio: validatedData.bio,
          website: validatedData.website,
          location: validatedData.location,
          social_links: validatedData.social_links,
          preferences: validatedData.preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
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

      // Sanitize updated profile to match AccountSettings interface
      const sanitizedUpdatedProfile = {
        id: (updatedProfile as unknown as ProfileData)?.id,
        email: (updatedProfile as unknown as ProfileData)?.email,
        name: (updatedProfile as unknown as ProfileData)?.name,
        role: user.role, // Use actual user role
        avatar_url: (updatedProfile as unknown as ProfileData)?.avatar_url,
        bio: (updatedProfile as unknown as ProfileData)?.bio,
        website: (updatedProfile as unknown as ProfileData)?.website,
        location: (updatedProfile as unknown as ProfileData)?.location,
        social_links: (updatedProfile as unknown as ProfileData)?.social_links || {},
        preferences: (updatedProfile as unknown as ProfileData)?.preferences || {},
        is_active: true, // Default to active since user_profiles doesn't track this
        last_login_at: null,
        email_verified: (updatedProfile as unknown as ProfileData)?.email_verified || false,
        last_sign_in_at: null,
        created_at: (updatedProfile as unknown as ProfileData)?.created_at,
        updated_at: (updatedProfile as unknown as ProfileData)?.updated_at,
        article_count: 0,
        comment_count: 0,
        total_views: 0,
        total_likes: 0
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
    console.error(`=== PROFILE API ERROR START ===`);
    console.error(`User profile API error:`, error);
    console.error(`Error type:`, typeof error);
    console.error(`Error message:`, (error as Error).message);
    console.error(`Error stack:`, (error as Error).stack);
    console.error(`Error details:`, error);
    console.error(`User ID:`, user?.id || 'No user');
    console.error(`Request method:`, req.method);
    console.error(`Request headers:`, req.headers);
    console.error(`=== PROFILE API ERROR END ===`);
    
    // Try to provide more specific error information
    let errorMessage = 'An unexpected error occurred';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errorDetails = null;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = process.env.NODE_ENV === 'development' ? error.stack : null;
      
      // Check for specific error patterns
      if (error.message.includes('permission denied')) {
        errorCode = 'PERMISSION_DENIED';
        errorMessage = 'Database permission denied - RLS policies may need updating';
      } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
        errorCode = 'TABLE_NOT_FOUND';
        errorMessage = 'Database table not found';
      } else if (error.message.includes('connection')) {
        errorCode = 'CONNECTION_ERROR';
        errorMessage = 'Database connection failed';
      }
    }
    
    return res.status(500).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        details: errorDetails
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply basic authentication and error handler
export default withErrorHandler(handler);

                                        
