import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('=== EDITOR DASHBOARD STATS API ===');
    
    // Only allow GET
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token provided'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Check if user is an editor
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || (userData.role !== 'editor' && userData.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Editor role required.'
      });
    }

    // Initialize stats with default values
    const stats = {
      totalArticles: 0,
      publishedArticles: 0,
      draftArticles: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      recentArticles: 0
    };

    // Add cache control headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Get user's articles stats
    try {
      // Total articles
      const { count: totalCount, error: totalError } = await supabaseAdmin
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id);
      
      if (!totalError) stats.totalArticles = totalCount || 0;

      // Published articles
      const { count: publishedCount, error: publishedError } = await supabaseAdmin
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id)
        .eq('status', 'published');
      
      if (!publishedError) stats.publishedArticles = publishedCount || 0;

      // Draft articles
      const { count: draftCount, error: draftError } = await supabaseAdmin
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id)
        .eq('status', 'draft');
      
      if (!draftError) stats.draftArticles = draftCount || 0;

      // Recent articles (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentCount, error: recentError } = await supabaseAdmin
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());
      
      if (!recentError) stats.recentArticles = recentCount || 0;

      // Total views, likes, comments (sum)
      const { data: aggregateData, error: aggregateError } = await supabaseAdmin
        .from('articles')
        .select('views_count, likes_count, comments_count')
        .eq('author_id', user.id);
      
      if (!aggregateError && aggregateData) {
        stats.totalViews = aggregateData.reduce((sum, a) => sum + (a.views_count || 0), 0);
        stats.totalLikes = aggregateData.reduce((sum, a) => sum + (a.likes_count || 0), 0);
        stats.totalComments = aggregateData.reduce((sum, a) => sum + (a.comments_count || 0), 0);
      }

    } catch (error) {
      console.error('Editor stats failed:', error);
    }

    console.log('Final editor stats:', stats);

    return res.status(200).json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Editor dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

