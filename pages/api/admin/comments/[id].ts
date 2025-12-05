import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { verifySupabaseToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = await verifySupabaseToken(req.headers.authorization?.replace('Bearer ', '') || '');
    const { id } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Comment ID is required' });
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // DELETE - Delete comment
    if (req.method === 'DELETE') {
      // First check if comment exists
      const { data: comment, error: fetchError } = await supabaseAdmin
        .from('comments')
        .select('id')
        .eq('id', id)
        .single();

      if (fetchError || !comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      // Delete the comment
      const { error: deleteError } = await supabaseAdmin
        .from('comments')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting comment:', deleteError);
        return res.status(500).json({ error: 'Failed to delete comment' });
      }

      return res.status(200).json({ message: 'Comment deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Comment API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
