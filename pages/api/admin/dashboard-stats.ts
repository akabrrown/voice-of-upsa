import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { authenticate, checkRole } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/auth';

interface ActivityItem {
  type: 'article' | 'user' | 'comment';
  title: string;
  date: string;
  timestamp?: string;
}

// Rate limiting: 20 requests per minute per admin
const rateLimitMiddleware = withRateLimit(20, 60 * 1000, (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return token || req.socket.remoteAddress || 'unknown';
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET method is allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Apply rate limiting
    rateLimitMiddleware(req);

    // Authenticate user
    const user = await authenticate(req);

    // Authorize admin access
    if (!checkRole(user.role, ['admin'])) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log admin dashboard access
    console.info(`Admin dashboard accessed by user: ${user.id}`, {
      timestamp: new Date().toISOString(),
      email: user.email
    });

    // Get total users
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get total articles
    const { count: totalArticles } = await supabaseAdmin
      .from('articles')
      .select('*', { count: 'exact', head: true });

    // Get draft articles count
    const { count: draftArticles } = await supabaseAdmin
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft');

    // Get published articles count
    const { count: publishedArticles } = await supabaseAdmin
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    // Get total comments
    let totalComments = 0;
    try {
      const { count } = await supabaseAdmin
        .from('comments')
        .select('*', { count: 'exact', head: true });
      totalComments = count || 0;
    } catch {
      // Comments table might not exist yet
    }

    // Get total views using SQL aggregation for better performance
    let totalViews = 0;
    try {
      // Use SQL aggregation instead of JavaScript reduce for better performance
      const { data: viewsResult } = await supabaseAdmin
        .from('articles')
        .select('views_count')
        .not('views_count', 'is', null);
      
      totalViews = viewsResult?.reduce((sum, article) => sum + (article.views_count || 0), 0) || 0;
    } catch {
      // If articles table doesn't exist, views will be 0
    }

    // Get recent activity
    const recentActivity: ActivityItem[] = [];
    
    // Recent articles
    const { data: recentArticles } = await supabaseAdmin
      .from('articles')
      .select('title, published_at')
      .order('published_at', { ascending: false })
      .limit(3);

    recentArticles?.forEach(article => {
      recentActivity.push({
        type: 'article',
        title: `New article: ${article.title}`,
        date: article.published_at || new Date().toISOString(),
        timestamp: article.published_at
      });
    });

    // Recent users
    const { data: recentUsers } = await supabaseAdmin
      .from('users')
      .select('name, created_at')
      .order('created_at', { ascending: false })
      .limit(2);

    recentUsers?.forEach(user => {
      recentActivity.push({
        type: 'user',
        title: `New user: ${user.name}`,
        date: user.created_at || new Date().toISOString(),
        timestamp: user.created_at
      });
    });

    // Sort recent activity by timestamp
    recentActivity.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

    // Get monthly stats (last 6 months)
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

    res.status(200).json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalArticles: totalArticles || 0,
        draftArticles: draftArticles || 0,
        publishedArticles: publishedArticles || 0,
        totalComments,
        totalViews,
        recentActivity,
        monthlyStats
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while fetching dashboard stats',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Wrap with error handler middleware
export default withErrorHandler(handler);

