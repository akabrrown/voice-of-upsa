import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';

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
    // Authenticate user using admin client directly
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authorization token provided',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
          details: authError?.message
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if user is already verified
    if (user.email_confirmed_at) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_VERIFIED',
          message: 'Email is already verified',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Send verification email
    const { error: verificationError } = await supabaseAdmin.auth.resend({
      type: 'signup',
      email: user.email!,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    });

    if (verificationError) {
      console.error('Error sending verification email:', verificationError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'VERIFICATION_EMAIL_FAILED',
          message: 'Failed to send verification email',
          details: verificationError.message
        },
        timestamp: new Date().toISOString()
      });
    }

    // Update user's email_verified status in database (will be updated when they click the link)
    // For now, we just log that the verification was sent
    console.info(`Verification email sent to user: ${user.email}`, {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
      data: {
        email: user.email,
        verificationSent: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Email verification API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(handler);

