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
    console.log('Delete user API - Requester:', requesterUser.email);

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

    // Prevent admin from deleting themselves
    if (requesterUser.id === userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_DELETE_SELF',
          message: 'Cannot delete your own account',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Get the user to be deleted
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userToDelete, error: fetchError } = await (supabaseAdmin as any)
      .from('users')
      .select('id, email, name, role')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error(`User fetch failed for admin ${requesterUser.email}:`, fetchError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'USER_FETCH_FAILED',
          message: 'Failed to fetch user information',
          details: process.env.NODE_ENV === 'development' ? fetchError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Prevent deleting the last admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((userToDelete as any)?.role === 'admin') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: adminCount, error: adminCountError } = await (supabaseAdmin as any)
        .from('users')
        .select('id', { count: 'exact' })
        .eq('role', 'admin')
        .eq('is_active', true);

      if (adminCountError) {
        console.error('Admin count check error:', adminCountError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'ADMIN_COUNT_ERROR',
            message: 'Failed to verify admin count',
            details: process.env.NODE_ENV === 'development' ? adminCountError.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      if (adminCount && adminCount.length <= 1) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'LAST_ADMIN',
            message: 'Cannot delete the last admin user',
            details: 'At least one active admin user must remain in the system'
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    // Delete user from auth system first (if they exist in auth)
    // Note: Some users may be "orphaned" - they exist in public.users but not in auth.users
    try {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (authDeleteError) {
        // Check if the error is because the user doesn't exist in auth
        if (authDeleteError.message?.includes('not found') || authDeleteError.message?.includes('User not found')) {
          console.warn(`User ${userId} not found in auth system (orphaned user), continuing with database deletion`);
        } else {
          // For other errors, fail the request
          console.error('Auth deletion error:', authDeleteError);
          return res.status(500).json({
            success: false,
            error: {
              code: 'AUTH_DELETE_ERROR',
              message: 'Failed to delete user from authentication system',
              details: process.env.NODE_ENV === 'development' ? authDeleteError.message : null
            },
            timestamp: new Date().toISOString()
          });
        }
      } else {
        console.log(`User ${userId} successfully deleted from auth system`);
      }
    } catch (authError) {
      console.error('Auth deletion exception:', authError);
      // Check if it's a "user not found" error
      if ((authError as Error).message?.includes('not found')) {
        console.warn(`User ${userId} not found in auth system (orphaned user), continuing with database deletion`);
      } else {
        return res.status(500).json({
          success: false,
          error: {
            code: 'AUTH_DELETE_ERROR',
            message: 'Failed to delete user from authentication system',
            details: process.env.NODE_ENV === 'development' ? (authError as Error).message : null
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    // Delete user from database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabaseAdmin as any)
      .from('users')
      .delete()
      .eq('id', userId);
    if (deleteError) {
      console.error('Database deletion error:', deleteError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'Failed to delete user from database',
          details: process.env.NODE_ENV === 'development' ? deleteError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log permanent user deletion
    console.info(`User permanently deleted by admin: ${requesterUser.email}`, {
      targetUserId: userId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      targetUserEmail: (userToDelete as any)?.email,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      data: { 
        message: 'User permanently deleted successfully',
        deletedUser: userToDelete
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete user API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while deleting user',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'manage:users',
  auditAction: 'user_deleted'
}));
