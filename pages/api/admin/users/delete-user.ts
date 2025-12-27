import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
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

    // Get Supabase admin client
    const supabaseAdmin = await getSupabaseAdmin();
    if (!supabaseAdmin) {
      throw new Error('Failed to initialize Supabase admin client');
    }

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' }
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or expired session' }
      });
    }

    // Get the user from database to check their role
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (dbError || !dbUser) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions or user not found' }
      });
    }

    const userData = dbUser as { role: string };
    if (userData.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' }
      });
    }

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
    if (authUser.id === userId) {
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
      console.error(`User fetch failed for admin ${authUser.email}:`, fetchError);
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

    // Delete user from auth system first
    try {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (authDeleteError) {
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
    } catch (authError) {
      console.error('Auth deletion error:', authError);
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
    console.info(`User permanently deleted by admin: ${authUser.email}`, {
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

export default withErrorHandler(handler);
