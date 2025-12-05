import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'DELETE') {
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

    // Get the user to be deleted for logging
    const { data: userToDelete, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching user to delete:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch user information',
        details: fetchError.message
      });
    }

    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent deletion of the last admin
    const { data: adminCount, error: adminCountError } = await supabaseAdmin
      .from('users')
      .select('count')
      .eq('role', 'admin')
      .maybeSingle();

    if (adminCountError) {
      console.error('Error checking admin count:', adminCountError);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify admin count',
        details: adminCountError.message
      });
    }

    if (userToDelete.role === 'admin' && adminCount && adminCount.count <= 1) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete the last admin user. Please create another admin first.',
        details: 'At least one admin user must remain in the system.'
      });
    }

    // Delete the user from the users table
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete user',
        details: deleteError.message
      });
    }

    // Also delete the user from Supabase auth if they exist there
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    } catch (authError) {
      console.warn('User not found in auth or already deleted:', authError);
      // This is not critical - the user was deleted from our table
    }

    // Log the deletion
    console.info(`User deleted:`, {
      deletedUserId: userToDelete.id,
      deletedEmail: userToDelete.email,
      deletedRole: userToDelete.role,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      data: {
        deletedUser: {
          id: userToDelete.id,
          email: userToDelete.email,
          name: userToDelete.name,
          role: userToDelete.role
        }
      },
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

