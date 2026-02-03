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
    // Only allow POST method
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

    // SECURITY: withCMSSecurity already verified requester is an admin (see export at bottom)
    console.log('Restore user API - Requester:', requesterUser.email);

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

    // Restore user by setting is_active to true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: restoredUser, error } = await (supabaseAdmin as any)
      .from('users')
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, email, name, role, is_active, updated_at')
      .single();

    if (error) {
      console.error(`User restore failed for admin ${requesterUser.email}:`, error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'USER_RESTORE_FAILED',
          message: 'Failed to restore user',
          details: process.env.NODE_ENV === 'development' ? error.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log user restoration
    console.info(`User restored by admin: ${requesterUser.email}`, {
      targetUserId: userId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      targetUserEmail: (restoredUser as any)?.email,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      data: { 
        message: 'User restored successfully',
        user: restoredUser
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Restore user API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while restoring user',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'manage:users',
  auditAction: 'user_restored'
}));
