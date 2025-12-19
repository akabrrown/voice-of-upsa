import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';
import { z } from 'zod';

// Enhanced validation schema for user invitation
const inviteUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  role: z.enum(['user', 'editor', 'admin']).default('user'),
  message: z.string().max(500, 'Message too long').optional()
});

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string; securityLevel?: string }) {
  try {
    // Only allow POST for user invitations
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only POST method is allowed for user invitations',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate input with enhanced schema
    const validatedData = inviteUserSchema.parse(req.body);
    const { userId, role, message } = validatedData;

    // Log admin invitation action
    console.log(`Admin user invitation initiated`, {
      adminId: user.id,
      adminEmail: user.email,
      targetUserId: userId,
      role,
      message,
      timestamp: new Date().toISOString()
    });

    // Verify target user exists
    const { data: targetUser, error: fetchError } = await (await supabaseAdmin as any)
      .from('users')
      .select('id, email, name, role')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Admin invite user fetch error:', fetchError);
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Target user not found',
          details: process.env.NODE_ENV === 'development' ? fetchError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Prevent inviting self
    if (userId === user.id) {
      console.warn(`Admin attempted to invite self`, {
        adminId: user.id,
        timestamp: new Date().toISOString()
      });
      
      return res.status(400).json({
        success: false,
        error: {
          code: 'SELF_INVITATION',
          message: 'Cannot invite yourself',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if user is already invited or has the role
    if (targetUser.role === role) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_HAS_ROLE',
          message: 'User already has this role',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Update user role and invitation status
    const { data: updatedUser, error: updateError } = await (await supabaseAdmin as any)
      .from('users')
      .update({
        role,
        invited_by: user.id,
        invited_at: new Date().toISOString(),
        invitation_message: message,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, email, name, role, invited_by, invited_at')
      .single();

    if (updateError) {
      console.error('Admin invite user update error:', updateError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to invite user',
          details: process.env.NODE_ENV === 'development' ? updateError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log successful invitation
    console.log(`Admin user invited successfully`, {
      adminId: user.id,
      invitedUserId: targetUser.id,
      invitedEmail: targetUser.email,
      invitedName: targetUser.name,
      role,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'User invited successfully',
      data: {
        user: updatedUser,
        invited_by: user.id,
        invited_at: updatedUser.invited_at
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin invite user API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while inviting the user',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply CMS security middleware and enhanced error handler
export default withErrorHandler(withCMSSecurity(handler));

                                      
                  
