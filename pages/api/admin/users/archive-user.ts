import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, CMSUser } from '@/lib/security/cms-security';

async function handler(req: NextApiRequest, res: NextApiResponse, requesterUser: CMSUser) {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    if (!supabaseAdmin) {
      throw new Error('Failed to initialize Supabase admin client');
    }
    // Only allow DELETE method
    if (req.method !== 'DELETE') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only DELETE method is allowed',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // SECURITY: withCMSSecurity already verified requester is an admin (see export at bottom)
    console.log('Archive user API - Requester:', requesterUser.email);

    // Get userId from query parameter
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: 'Valid user ID is required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Prevent admin from archiving themselves
    if (requesterUser.id === userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_ARCHIVE_SELF',
          message: 'Cannot archive your own account',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Get the reason from request body (optional)
    const { reason } = req.body || {};

    // Archive user by setting is_active to false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: archivedUser, error } = await (supabaseAdmin as any)
      .from('users')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, email, name, role, is_active, updated_at')
      .single();
    if (error) {
      console.error(`User archive failed for admin ${requesterUser.email}:`, error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'USER_ARCHIVE_FAILED',
          message: 'Failed to archive user',
          details: process.env.NODE_ENV === 'development' ? error.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log user archiving
    console.info(`User archived by admin: ${requesterUser.email}`, {
      targetUserId: userId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      targetUserEmail: (archivedUser as any)?.email,
      reason: reason || 'No reason provided',
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      data: { 
        message: 'User archived successfully',
        user: archivedUser
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Archive user API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while archiving user',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'manage:users',
  auditAction: 'user_archived'
}));
