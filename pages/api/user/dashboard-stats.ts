import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, getCMSRateLimit } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string; securityLevel?: string }) {
  try {
    // Apply rate limiting for dashboard stats
    const rateLimit = getCMSRateLimit('GET');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Log user dashboard access
    console.log(`User dashboard stats accessed by user: ${user.email} (${user.id})`, {
      timestamp: new Date().toISOString(),
      securityLevel: user.securityLevel
    });

    // Only allow GET
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
    // Add cache control headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Initialize stats with default values
    const stats = {
      totalArticles: 0,
      publishedArticles: 0,
      draftArticles: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalBookmarks: 0,
      recentActivity: 0
    };

    // Get user's articles stats
    try {
      const supabaseAdmin = await getSupabaseAdmin();
      
      // Total articles
      const { count: totalCount, error: totalError } = await (await supabaseAdmin as any)
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id);
      
      if (!totalError) stats.totalArticles = totalCount || 0;

      // Published articles
      const { count: publishedCount, error: publishedError } = await (await supabaseAdmin as any)
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id)
        .eq('status', 'published');
      
      if (!publishedError) stats.publishedArticles = publishedCount || 0;

      // Draft articles
      const { count: draftCount, error: draftError } = await (await supabaseAdmin as any)
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id)
        .eq('status', 'draft');
      
      if (!draftError) stats.draftArticles = draftCount || 0;

      // Total views (sum of all article views)
      const { data: viewData, error: viewError } = await (await supabaseAdmin as any)
        .from('articles')
        .select('view_count')
        .eq('author_id', user.id)
        .eq('status', 'published');
      
      if (!viewError && viewData) {
        stats.totalViews = viewData.reduce((sum: number, article: any) => sum + (article.view_count || 0), 0);
      }

      // Total bookmarks
      const { count: bookmarkCount, error: bookmarkError } = await (await supabaseAdmin as any)
        .from('article_bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (!bookmarkError) stats.totalBookmarks = bookmarkCount || 0;

      // Recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentCount, error: recentError } = await (await supabaseAdmin as any)
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());
      
      if (!recentError) stats.recentActivity = recentCount || 0;

    } catch (statsError) {
      console.error(`Stats calculation failed for user ${user.email}:`, statsError);
    }

    console.log(`Dashboard stats returned to user ${user.email}:`, {
      totalArticles: stats.totalArticles,
      publishedArticles: stats.publishedArticles,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      data: { stats },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`User dashboard stats API error for user ${user.email}:`, error);
    return res.status(500).json({
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

// Apply enhanced CMS security middleware and error handler
export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'view:analytics',
  auditAction: 'user_dashboard_accessed'
}));
    
            
