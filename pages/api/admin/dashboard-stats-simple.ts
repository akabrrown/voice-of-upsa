import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('=== SIMPLE DASHBOARD STATS API ===');
    
    // Only allow GET
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

    // Test database connection first
    console.log('Testing database connection...');
    const { error: testConnError } = await supabaseAdmin
      .from('categories')
      .select('count')
      .limit(1);

    if (testConnError) {
      console.error('Database connection failed:', testConnError);
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: testConnError.message
      });
    }

    console.log('Database connection OK');

    // Get total users
    console.log('Fetching users count...');
    let totalUsers = 0;
    try {
      const { count } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true });
      totalUsers = count || 0;
      console.log('Users count:', totalUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }

    // Get total articles
    console.log('Fetching articles count...');
    let totalArticles = 0;
    let publishedArticles = 0;
    let draftArticles = 0;
    try {
      const { data: articles } = await supabaseAdmin
        .from('articles')
        .select('status');
      
      totalArticles = articles?.length || 0;
      publishedArticles = articles?.filter(a => a.status === 'published').length || 0;
      draftArticles = articles?.filter(a => a.status === 'draft').length || 0;
      console.log('Articles counts:', { totalArticles, publishedArticles, draftArticles });
    } catch (error) {
      console.error('Error fetching articles:', error);
    }

    // Get total views
    console.log('Fetching total views...');
    let totalViews = 0;
    try {
      const { data: articles } = await supabaseAdmin
        .from('articles')
        .select('views_count')
        .not('views_count', 'is', null);
      
      totalViews = articles?.reduce((sum, article) => sum + (article.views_count || 0), 0) || 0;
      console.log('Total views:', totalViews);
    } catch (error) {
      console.error('Error fetching views:', error);
    }

    // Get total comments
    console.log('Fetching comments count...');
    let totalComments = 0;
    try {
      const { count } = await supabaseAdmin
        .from('comments')
        .select('*', { count: 'exact', head: true });
      totalComments = count || 0;
      console.log('Comments count:', totalComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      // Comments table might not exist yet
    }

    // Get recent articles (last 7 days)
    console.log('Fetching recent articles...');
    let recentArticles = 0;
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count } = await supabaseAdmin
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());
      
      recentArticles = count || 0;
      console.log('Recent articles:', recentArticles);
    } catch (error) {
      console.error('Error fetching recent articles:', error);
    }

    const stats = {
      totalArticles,
      totalUsers,
      totalViews,
      totalComments,
      recentArticles,
      publishedArticles,
      draftArticles
    };

    console.log('Final stats:', stats);

    return res.status(200).json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

