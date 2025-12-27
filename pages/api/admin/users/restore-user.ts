import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
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
      console.error(`User restore failed for admin ${authUser.email}:`, error);
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
    console.info(`User restored by admin: ${authUser.email}`, {
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

export default withErrorHandler(handler);
