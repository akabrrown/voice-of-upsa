import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('=== RELIABLE DASHBOARD STATS API ===');
    
    // Only allow GET
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

    // Authenticate user using admin client directly
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
      console.error('Auth error:', authError);
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      console.error('Authorization error:', { userError, role: userData?.role });
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    console.log('User authenticated as admin:', user.id);

    // Initialize stats with default values
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stats: any = {
      totalArticles: 0,
      totalUsers: 0,
      totalViews: 0,
      totalComments: 0,
      recentArticles: 0,
      publishedArticles: 0,
      draftArticles: 0,
      monthlyStats: []
    };

    // Add cache control headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Get total users count
    try {
      // DEBUG: Check if service role key is available
      const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
      console.log('Has Service Role Key:', hasServiceKey);

      const { count, error } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      console.log('Users Query Result:', { count, error: error?.message });

      if (!error) {
        stats.totalUsers = count || 0;
      } else {
        console.error('Users count error:', error);
      }
    } catch (error) {
      console.error('Users count failed:', error);
    }

    // Get article stats
    try {
      // Total articles
      const { count: totalCount, error: totalError } = await supabaseAdmin
        .from('articles')
        .select('*', { count: 'exact', head: true });
      
      if (!totalError) stats.totalArticles = totalCount || 0;

      // Published articles
      const { count: publishedCount, error: publishedError } = await supabaseAdmin
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');
      
      if (!publishedError) stats.publishedArticles = publishedCount || 0;

      // Draft articles
      const { count: draftCount, error: draftError } = await supabaseAdmin
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft');
      
      if (!draftError) stats.draftArticles = draftCount || 0;

      // Recent articles (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentCount, error: recentError } = await supabaseAdmin
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());
      
      if (!recentError) stats.recentArticles = recentCount || 0;

      // Total views (sum) - still need to fetch data for this, but only select views_count
      const { data: viewsData, error: viewsError } = await supabaseAdmin
        .from('articles')
        .select('views_count');
      
      if (!viewsError && viewsData) {
        stats.totalViews = viewsData.reduce((sum, a) => sum + (a.views_count || 0), 0);
      }

    } catch (error) {
      console.error('Articles stats failed:', error);
    }

    // Get comments count
    try {
      const { count, error } = await supabaseAdmin
        .from('comments')
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        stats.totalComments = count || 0;
      }
    } catch (error) {
      console.error('Comments count failed:', error);
    }

    // Get monthly stats (last 6 months)
    try {
      const monthlyStats = [];
      const currentDate = new Date();
      
      for (let i = 0; i < 6; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();
        
        // Get users created in this month
        const { count: monthUsers } = await supabaseAdmin
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth)
          .lt('created_at', endOfMonth);
        
        // Get articles published in this month
        const { count: monthArticles } = await supabaseAdmin
          .from('articles')
          .select('*', { count: 'exact', head: true })
          .gte('published_at', startOfMonth)
          .lt('published_at', endOfMonth);
        
        // Get views for articles in this month
        const { data: monthArticlesData } = await supabaseAdmin
          .from('articles')
          .select('views_count')
          .gte('published_at', startOfMonth)
          .lt('published_at', endOfMonth);
        
        const monthViews = monthArticlesData?.reduce((sum, article) => sum + (article.views_count || 0), 0) || 0;
        
        monthlyStats.push({
          month: monthName,
          users: monthUsers || 0,
          articles: monthArticles || 0,
          views: monthViews
        });
      }

      monthlyStats.reverse(); // Show oldest to newest
      stats.monthlyStats = monthlyStats;
    } catch (error) {
      console.error('Monthly stats failed:', error);
    }

    console.log('Final stats:', stats);

    return res.status(200).json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Reliable dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Wrap with error handler middleware
export default withErrorHandler(handler);

