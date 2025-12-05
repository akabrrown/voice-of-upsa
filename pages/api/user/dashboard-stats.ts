import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';

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
    // Authenticate user using admin client directly
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authorization token provided',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token and get user
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !authUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Create user object for compatibility
    const user = {
      id: authUser.id,
      email: authUser.email
    };

    // Get user role from database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          details: userError?.message
        },
        timestamp: new Date().toISOString()
      });
    }

    // Add cache control headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Get dashboard stats using manual queries
    const [
      articlesResult,
      publishedArticlesResult,
      draftArticlesResult,
      totalViewsResult,
      commentsResult,
      bookmarksResult
    ] = await Promise.all([
      // Count all user's articles
      supabaseAdmin
        .from('articles')
        .select('id', { count: 'exact' })
        .eq('author_id', user.id),

      // Count published articles
      supabaseAdmin
        .from('articles')
        .select('id', { count: 'exact' })
        .eq('author_id', user.id)
        .eq('status', 'published'),

      // Count draft articles
      supabaseAdmin
        .from('articles')
        .select('id', { count: 'exact' })
        .eq('author_id', user.id)
        .eq('status', 'draft'),

      // Sum total views
      supabaseAdmin
        .from('articles')
        .select('views_count')
        .eq('author_id', user.id)
        .eq('status', 'published'),

      // Count user's comments
      supabaseAdmin
        .from('comments')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'published'),

      // Count user's bookmarks
      supabaseAdmin
        .from('article_bookmarks')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
    ]);

    const stats = {
      articles_count: articlesResult.count || 0,
      published_articles: publishedArticlesResult.count || 0,
      draft_articles: draftArticlesResult.count || 0,
      total_views: totalViewsResult.data?.reduce((sum, article) => sum + (article.views_count || 0), 0) || 0,
      total_comments: commentsResult.count || 0,
      bookmarked_articles: bookmarksResult.count || 0
    };

    // Get recent articles if user is editor or admin
    interface RecentArticle {
      id: string;
      title: string;
      status: string;
      created_at: string;
      published_at: string | null;
      views_count: number;
      likes_count: number;
    }

    let recentArticles: RecentArticle[] = [];
    if (['editor', 'admin'].includes(userData.role)) {
      const { data: articles } = await supabaseAdmin
        .from('articles')
        .select('id, title, status, created_at, published_at, views_count, likes_count')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      recentArticles = articles || [];
    }

    // Get recent activity using proper joins
    const [recentBookmarks, recentComments] = await Promise.all([
      // Get recent bookmarks
      supabaseAdmin
        .from('article_bookmarks')
        .select(`
          created_at,
          article:articles(id, title, slug)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3),

      // Get recent comments
      supabaseAdmin
        .from('comments')
        .select(`
          created_at,
          article:articles(id, title, slug)
        `)
        .eq('user_id', user.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(3)
    ]);

    // Define interfaces for type safety
    interface ActivityItem {
      type: 'article' | 'comment';
      title: string;
      slug: string;
      timestamp: string;
      action: string;
    }

    // Build recent activity array
    const recentActivity: ActivityItem[] = [
      ...recentBookmarks.data?.map((bookmark: { created_at: string; article: { id: string; title: string; slug: string }[] }) => {
        const article = bookmark.article[0];
        return {
          type: 'article' as const,
          title: article?.title || 'Unknown Article',
          slug: article?.slug || '',
          timestamp: bookmark.created_at,
          action: 'bookmarked'
        };
      }) || [],
      ...recentComments.data?.map((comment: { created_at: string; article: { id: string; title: string; slug: string }[] }) => {
        const article = comment.article[0];
        return {
          type: 'comment' as const,
          title: article?.title || 'Unknown Article',
          slug: article?.slug || '',
          timestamp: comment.created_at,
          action: 'commented on'
        };
      }) || []
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, 5);

    // Combine stats with additional data
    const response = {
      ...stats,
      recentArticles,
      recentActivity,
      role: userData.role
    };

    res.status(200).json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
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

