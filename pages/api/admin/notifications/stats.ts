import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '../../../../lib/database-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Check authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const admin = await getSupabaseAdmin();
    
    // Verify token and role (basic check)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await admin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Parallel fetch for stats
    const [
      { count: storiesCount },
      { count: messagesCount },
      { count: commentsCount }
    ] = await Promise.all([
      // Pending anonymous stories
      admin
        .from('anonymous_stories')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
        
      // New contact messages
      admin
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new'),

      // Pending comments
      admin
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
    ]);

    const stats = {
      stories: storiesCount || 0,
      messages: messagesCount || 0,
      comments: commentsCount || 0,
      total: (storiesCount || 0) + (messagesCount || 0) + (commentsCount || 0)
    };

    return res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Notification stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
