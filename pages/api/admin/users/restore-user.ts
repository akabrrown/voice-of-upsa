import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { Database } from '@/lib/database-types';

type DatabaseUser = Database['public']['Tables']['users']['Row'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get the current admin user (from session or request headers)
    const authHeader = req.headers.authorization;
    let restoredBy = null;
    
    if (authHeader) {
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
        restoredBy = user?.id;
      } catch (error) {
        console.warn('Could not identify admin user:', error);
      }
    }

    // Get the user to be restored
    const { data: userToRestore, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle() as { data: DatabaseUser | null, error: { message: string } | null };

    if (fetchError) {
      console.error('Error fetching user to restore:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch user information',
        details: fetchError.message
      });
    }

    if (!userToRestore) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is archived
    if (userToRestore.status !== 'archived') {
      return res.status(400).json({
        success: false,
        error: 'User is not archived and cannot be restored'
      });
    }

    // Restore the user (update status and clear archive info)
    const { error: restoreError } = await supabaseAdmin
      .from('users')
      .update<Database['public']['Tables']['users']['Update']>({
        status: 'active',
        archived_at: null,
        archived_by: null,
        archive_reason: null
      })
      .eq('id', userId);

    if (restoreError) {
      console.error('Error restoring user:', restoreError);
      return res.status(500).json({
        success: false,
        error: 'Failed to restore user',
        details: restoreError.message
      });
    }

    // Restore their auth session by updating their auth metadata
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          account_status: 'active',
          archived_at: null,
          archive_reason: null,
          restored_at: new Date().toISOString()
        }
      });
    } catch (authError) {
      console.warn('Could not update user auth metadata:', authError);
      // This is not critical - the user was restored in our table
    }

    // Log the restoration
    console.info(`User restored:`, {
      restoredUserId: userToRestore.id,
      restoredEmail: userToRestore.email,
      restoredRole: userToRestore.role,
      restoredBy: restoredBy,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      data: {
        restoredUser: {
          id: userToRestore.id,
          email: userToRestore.email,
          name: userToRestore.name,
          role: userToRestore.role,
          status: 'active',
          restored_at: new Date().toISOString()
        }
      },
      message: 'User restored successfully. They can now access their account again.'
    });

  } catch (error) {
    console.error('Restore user API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

