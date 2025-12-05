import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { authenticate } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Validation schemas
const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must not exceed 255 characters'),
  bio: z.string().max(1000, 'Bio must not exceed 1000 characters').optional().nullable(),
  avatar_url: z.string().url('Invalid avatar URL').optional().nullable(),
  website: z.string().url('Invalid website URL').optional().nullable(),
  location: z.string().max(255, 'Location must not exceed 255 characters').optional().nullable(),
  social_links: z.record(z.unknown()).optional(),
  preferences: z.record(z.unknown()).optional()
});

// Rate limiting: 10 profile updates per hour per user
const rateLimitMiddleware = withRateLimit(10, 60 * 60 * 1000, (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return token || req.socket.remoteAddress || 'unknown';
});

// Input sanitization middleware
const sanitizeMiddleware = (req: NextApiRequest) => {
  const fields = ['name', 'bio', 'location'];
  fields.forEach(field => {
    if (req.body[field]) {
      req.body[field] = req.body[field]
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
    }
  });
};

interface UserProfile {
  id: string;
  email: string | null;
  name: string;
  role: 'user' | 'admin' | 'editor';
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  social_links: Record<string, unknown>;
  preferences: Record<string, unknown>;
  is_active: boolean;
  last_login_at: string | null;
  email_verified: boolean;
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authenticate user using the new middleware
  const user = await authenticate(req);

  // GET - User profile
  if (req.method === 'GET') {
    try {
      
      // Get user profile from database
      let profile: UserProfile | null = null;
      
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // Handle case where profile doesn't exist or table doesn't exist
      if (profileError) {
        // If table doesn't exist or permission denied, create fallback profile
        if (profileError.code === 'PGRST116' || 
            profileError.code === '42501' || 
            profileError.message?.includes('does not exist') ||
            profileError.message?.includes('permission denied')) {
        
        const authRole = user.role;
        
        profile = {
          id: user.id,
          email: user.email || null,
          name: user.email?.split('@')[0] || 'User',
          role: (authRole as 'user' | 'editor' | 'admin') || 'user',
          avatar_url: null,
          bio: null,
          website: null,
          location: null,
          social_links: {},
          preferences: {},
          is_active: true,
          last_login_at: new Date().toISOString(),
          email_verified: false,
          last_sign_in_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        } else if (profileError.code !== 'PGRST116') {
          return res.status(500).json({
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to fetch user profile',
              details: profileError.message
            },
            timestamp: new Date().toISOString()
          });
        }
      } else {
        profile = profileData;
      }

      // If profile doesn't exist, try to create it
      if (!profile) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newProfile, error: createError } = await (supabaseAdmin as any)
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            name: user.email?.split('@')[0] || 'User',
            bio: null,
            avatar_url: null,
            website: null,
            location: null,
            social_links: {},
            preferences: {},
            role: 'user',
            is_active: true,
            email_verified: false,
            last_sign_in_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('*')
          .single();

        if (createError) {
          // If it's a conflict, try to fetch existing profile
          if (createError.code === '23505' || createError.message?.includes('duplicate')) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: existingProfile, error: fetchError } = await (supabaseAdmin as any)
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single();
            
            if (!fetchError && existingProfile) {
              profile = existingProfile;
            } else {
              profile = {
                id: user.id,
                email: user.email || null,
                name: user.email?.split('@')[0] || 'User',
                role: 'user',
                avatar_url: null,
                bio: null,
                website: null,
                location: null,
                social_links: {},
                preferences: {},
                is_active: true,
                last_login_at: new Date().toISOString(),
                email_verified: false,
                last_sign_in_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
            }
          } else {
            profile = {
              id: user.id,
              email: user.email || null,
              name: user.email?.split('@')[0] || 'User',
              role: 'user',
              avatar_url: null,
              bio: null,
              website: null,
              location: null,
              social_links: {},
              preferences: {},
              is_active: true,
              last_login_at: new Date().toISOString(),
              email_verified: false,
              last_sign_in_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          }
        } else {
          profile = newProfile;
        }
      }

      // Get user stats (with fallback)
      let stats = { articles_count: 0, comments_count: 0, total_views: 0, total_likes: 0 };

      if (profile) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: userStats, error: statsError } = await (supabaseAdmin as any)
            .from('user_profile_stats')
            .select('articles_count, comments_count, total_views, total_likes')
            .eq('id', user.id)
            .maybeSingle();

          if (!statsError && userStats) {
            stats = userStats;
          }
        } catch {
          // Stats table might not exist, use defaults
        }
      }

      // Combine profile data with stats
      const profileWithStats = {
        ...profile,
        article_count: stats.articles_count,
        comment_count: stats.comments_count,
        total_views: stats.total_views,
        total_likes: stats.total_likes,
      };

      // FINAL OVERRIDE: Ensure admin role from authentication takes precedence
      if (user.role === 'admin') {
        profileWithStats.role = 'admin';
      }

      return res.status(200).json({
        success: true,
        data: {
          profile: profileWithStats,
          stats: stats
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while fetching profile',
          details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  // PUT - Update user profile
  if (req.method === 'PUT') {
    try {
      // Apply rate limiting
      rateLimitMiddleware(req);

      // Validate and sanitize input
      profileUpdateSchema.parse(req.body);
      sanitizeMiddleware(req);
      const { name, bio, avatar_url, website, location, social_links, preferences } = req.body;

      // Check if user exists in database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingProfile } = await (supabaseAdmin as any)
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      const updateData: Record<string, unknown> = {
        name: name.trim(),
        updated_at: new Date().toISOString()
      };

      // Optional fields
      if (bio !== undefined) {
        updateData.bio = typeof bio === 'string' ? bio.trim() : null;
      }
      
      if (avatar_url !== undefined) {
        updateData.avatar_url = avatar_url || null;
      }

      if (website !== undefined) {
        updateData.website = website && typeof website === 'string' ? website.trim() : null;
      }

      if (location !== undefined) {
        updateData.location = location && typeof location === 'string' ? location.trim() : null;
      }

      if (social_links !== undefined) {
        updateData.social_links = typeof social_links === 'object' ? social_links : {};
      }

      if (preferences !== undefined) {
        updateData.preferences = typeof preferences === 'object' ? preferences : {};
      }

      let result;
      let profileError;
      
      if (existingProfile) {
        // Update existing profile
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ data: result, error: profileError } = await (supabaseAdmin as any)
          .from('users')
          .update(updateData)
          .eq('id', user.id)
          .select('*')
          .single());
      } else {
        // Create new profile
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ data: result, error: profileError } = await (supabaseAdmin as any)
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            name: name.trim(),
            bio: bio?.trim() || null,
            avatar_url: avatar_url || null,
            website: website?.trim() || null,
            location: location?.trim() || null,
            social_links: social_links || {},
            preferences: preferences || {},
            role: 'user',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('*')
          .single());
      }

      if (profileError) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'PROFILE_UPDATE_FAILED',
            message: 'Failed to update user profile',
            details: profileError.message
          },
          timestamp: new Date().toISOString()
        });
      }

      // Get updated stats
      let stats = { articles_count: 0, comments_count: 0, total_views: 0, total_likes: 0 };
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: userStats, error: statsError } = await (supabaseAdmin as any)
          .from('user_profile_stats')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!statsError && userStats) {
          stats = {
            articles_count: userStats.articles_count || 0,
            comments_count: userStats.comments_count || 0,
            total_views: userStats.total_views || 0,
            total_likes: userStats.total_likes || 0,
          };
        }
      } catch {
        // Stats query failed, but don't fail the entire request
      }

      // Combine profile data with stats
      const profileWithStats = {
        ...result,
        article_count: stats.articles_count,
        comment_count: stats.comments_count,
        total_views: stats.total_views,
        total_likes: stats.total_likes,
      };

      return res.status(200).json({
        success: true,
        data: {
          profile: profileWithStats,
          stats: stats
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Profile PUT error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while updating profile',
          details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
        },
        timestamp: new Date().toISOString()
      });
    }
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
}

// Wrap with error handler middleware
export default withErrorHandler(handler);

