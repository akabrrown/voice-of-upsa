import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// Enhanced validation schema for sending invitations
const sendInvitationSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  role: z.enum(['user', 'editor', 'admin']).default('user'),
  message: z.string().max(500, 'Message too long').optional()
});

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string; securityLevel?: string }) {
  try {
    // Only allow POST for sending invitations
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only POST method is allowed for sending invitations',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate input with enhanced schema
    const validatedData = sendInvitationSchema.parse(req.body);
    const { email, role, message } = validatedData;

    // Log admin invitation action
    console.log(`Admin invitation email send initiated`, {
      adminId: user.id,
      adminEmail: user.email,
      targetEmail: email,
      role,
      message,
      timestamp: new Date().toISOString()
    });

    // Check if user already exists
    const { data: existingUser, error: existingError } = await (await supabaseAdmin as any)
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Admin send invitation check error:', existingError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CHECK_ERROR',
          message: 'Failed to check if user exists',
          details: process.env.NODE_ENV === 'development' ? existingError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists',
          details: 'Use the invite endpoint to invite existing users'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Generate invitation token
    const { data: inviteData, error: inviteError } = await (await supabaseAdmin as any).auth.admin.generateLink({
      type: 'signup',
      email,
      password: randomUUID(), // Generate temporary password for invitation
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/signup`
      }
    });

    if (inviteError) {
      console.error('Admin invitation generation error:', inviteError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INVITATION_GENERATION_FAILED',
          message: 'Failed to generate invitation link',
          details: process.env.NODE_ENV === 'development' ? inviteError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log successful invitation generation
    console.log(`Admin invitation email generated successfully`, {
      adminId: user.id,
      targetEmail: email,
      role,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Invitation email generated successfully',
      data: {
        email,
        role,
        invitationLink: inviteData.properties?.action_link,
        invited_by: user.id,
        invited_at: new Date().toISOString(),
        message
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin send invitation API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while sending the invitation',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply CMS security middleware and enhanced error handler
export default withErrorHandler(withCMSSecurity(handler));
  
        
                  
    
        
