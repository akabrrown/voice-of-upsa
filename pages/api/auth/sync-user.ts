import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { z } from 'zod';

// Validation schema for webhook events
const syncUserSchema = z.object({
  event: z.enum(['signup', 'user.created', 'user.updated', 'email_verification']).optional(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    user_metadata: z.object({
      full_name: z.string().optional(),
      avatar_url: z.string().optional()
    }).optional(),
    email_confirmed_at: z.string().optional().nullable()
  }).optional(),
  userId: z.string().optional(),
  emailVerified: z.boolean().optional()
});

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
    // Validate webhook payload
    const validatedData = syncUserSchema.parse(req.body);
    const { event, user: authUser, userId, emailVerified } = validatedData;

    // Handle email verification update
    if (event === 'email_verification' || (userId && emailVerified !== undefined)) {
      const targetUserId = userId || authUser?.id;
      if (!targetUserId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'User ID is required for email verification update',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabaseAdmin as any)
        .from('users')
        .update({
          email_verified: emailVerified,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetUserId);

      if (updateError) {
        console.error('Error updating email verification status:', updateError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'EMAIL_VERIFICATION_UPDATE_FAILED',
            message: 'Failed to update email verification status',
            details: updateError.message
          },
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Email verification status updated successfully',
        timestamp: new Date().toISOString()
      });
    }

    // Handle Supabase auth webhook events
    if (!authUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'User data is required for webhook events',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    console.info(`Auth webhook event: ${event} for user: ${authUser.id}`, {
      timestamp: new Date().toISOString(),
      email: authUser.email
    });

    // Handle Supabase auth events
    switch (event) {
      case 'signup':
      case 'user.created':
        // Create user profile in database
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: user, error } = await (supabaseAdmin as any)
          .from('users')
          .upsert({
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            role: 'user',
            avatar_url: authUser.user_metadata?.avatar_url || null,
            bio: null,
            website: null,
            location: null,
            social_links: {},
            preferences: {},
            email_verified: authUser.email_confirmed_at ? true : false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating user in database:', error);
          return res.status(500).json({
            success: false,
            error: {
              code: 'USER_CREATION_FAILED',
              message: 'Failed to create user profile',
              details: error.message
            },
            timestamp: new Date().toISOString()
          });
        }

        console.info(`User profile created successfully: ${authUser.id}`);
        return res.status(200).json({
          success: true,
          data: { user },
          timestamp: new Date().toISOString()
        });

      case 'user.updated':
        // Update user profile in database
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabaseAdmin as any)
          .from('users')
          .update({
            email: authUser.email,
            name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            avatar_url: authUser.user_metadata?.avatar_url || null,
            email_verified: authUser.email_confirmed_at ? true : false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', authUser.id);

        if (updateError) {
          console.error('Error updating user in database:', updateError);
          return res.status(500).json({
            success: false,
            error: {
              code: 'USER_UPDATE_FAILED',
              message: 'Failed to update user profile',
              details: updateError.message
            },
            timestamp: new Date().toISOString()
          });
        }

        console.info(`User profile updated successfully: ${authUser.id}`);
        return res.status(200).json({
          success: true,
          data: { message: 'User profile updated' },
          timestamp: new Date().toISOString()
        });

      default:
        return res.status(200).json({
          success: true,
          data: { message: 'Event not handled' },
          timestamp: new Date().toISOString()
        });
    }

  } catch (error) {
    console.error('Auth webhook error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing webhook',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Wrap with error handler middleware
export default withErrorHandler(handler);

