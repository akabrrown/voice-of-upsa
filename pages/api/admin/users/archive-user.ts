import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { Database } from '@/lib/database-types';

type DatabaseUser = Database['public']['Tables']['users']['Row'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'DELETE') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

    const { userId } = req.query;
    const { reason } = req.body || {};
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get the current admin user (from session or request headers)
    const authHeader = req.headers.authorization;
    let archivedBy = null;
    
    if (authHeader) {
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
        archivedBy = user?.id;
      } catch (error) {
        console.warn('Could not identify admin user:', error);
      }
    }

    // Get the user to be archived
    const { data: userToArchive, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle() as { data: DatabaseUser | null, error: { message: string } | null };

    if (fetchError) {
      console.error('Error fetching user to archive:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch user information',
        details: fetchError.message
      });
    }

    if (!userToArchive) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is already archived
    if (userToArchive.status === 'archived') {
      return res.status(400).json({
        success: false,
        error: 'User is already archived'
      });
    }

    // Prevent archiving the last admin
    if (userToArchive.role === 'admin') {
      const { data: adminCount, error: adminCountError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .eq('status', 'active') as { data: { id: string }[] | null, error: { message: string } | null };

      if (adminCountError) {
        console.error('Error checking admin count:', adminCountError);
        return res.status(500).json({
          success: false,
          error: 'Failed to verify admin count',
          details: adminCountError.message
        });
      }

      if (adminCount && adminCount.length <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot archive the last admin user. Please create another admin first.',
          details: 'At least one active admin user must remain in the system.'
        });
      }
    }

    // Archive the user (update status and add archive info)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: archiveError } = await (supabaseAdmin as any)
      .from('users')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        archived_by: archivedBy,
        archive_reason: reason || 'Admin decision',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (archiveError) {
      console.error('Error archiving user:', archiveError);
      return res.status(500).json({
        success: false,
        error: 'Failed to archive user',
        details: archiveError.message
      });
    }

    // Disable their auth session by updating their auth metadata
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          account_status: 'archived',
          archived_at: new Date().toISOString(),
          archive_reason: reason || 'Admin decision'
        }
      });
    } catch (authError) {
      console.warn('Could not update user auth metadata:', authError);
      // This is not critical - the user was archived in our table
    }

    // Log the archiving
    console.info(`User archived:`, {
      archivedUserId: userToArchive.id,
      archivedEmail: userToArchive.email,
      archivedRole: userToArchive.role,
      archivedBy: archivedBy,
      reason: reason || 'Admin decision',
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      data: {
        archivedUser: {
          id: userToArchive.id,
          email: userToArchive.email,
          name: userToArchive.name,
          role: userToArchive.role,
          status: 'archived',
          archived_at: new Date().toISOString(),
          archive_reason: reason || 'Admin decision'
        }
      },
      message: 'User archived successfully. They can be restored later if needed.'
    });

  } catch (error) {
    console.error('Archive user API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

