import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, getCMSRateLimit } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Enhanced validation schema for query parameters
const bookmarksQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page must be a number').transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').transform(Number).default('10'),
  category: z.string().optional()
});

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string; securityLevel?: string }) {
  try {
    // Apply rate limiting for bookmarks
    const rateLimit = getCMSRateLimit('GET');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Log bookmarks access
    console.log(`User bookmarks accessed by user: ${user.email} (${user.id})`, {
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
        // Validate query parameters
    const validatedQuery = bookmarksQuerySchema.parse(req.query);
    const { page, limit } = validatedQuery;
    const offset = (page - 1) * limit;

    // Get user's bookmarked articles
    const { data: bookmarks, error: bookmarksError } = await supabaseAdmin
      .from('article_bookmarks')
      .select(`
        id,
        article_id,
        created_at,
        articles (
          id,
          title,
          slug,
          excerpt,
          featured_image,
          author_id,
          status,
          published_at,
          view_count
        )
      `)
      .eq('user_id', user.id)
      .eq('articles.status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (bookmarksError) {
      console.error(`Bookmarks fetch failed for user ${user.email}:`, bookmarksError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'BOOKMARKS_FETCH_FAILED',
          message: 'Failed to fetch bookmarks',
          details: process.env.NODE_ENV === 'development' ? bookmarksError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('article_bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('articles.status', 'published');

    if (countError) {
      console.error(`Bookmarks count failed for user ${user.email}:`, countError);
    }

    const total = totalCount || 0;
    const totalPages = Math.ceil(total / limit);

    // Sanitize bookmark data
    const sanitizedBookmarks = bookmarks?.map(bookmark => ({
      id: bookmark.id,
      article_id: bookmark.article_id,
      created_at: bookmark.created_at,
      article: Array.isArray(bookmark.articles) && bookmark.articles.length > 0 ? {
        id: bookmark.articles[0].id,
        title: bookmark.articles[0].title,
        slug: bookmark.articles[0].slug,
        excerpt: bookmark.articles[0].excerpt,
        featured_image: bookmark.articles[0].featured_image,
        author_id: bookmark.articles[0].author_id,
        status: bookmark.articles[0].status,
        published_at: bookmark.articles[0].published_at,
        view_count: bookmark.articles[0].view_count
      } : null
    })) || [];

    console.log(`Bookmarks returned to user ${user.email}:`, {
      count: sanitizedBookmarks.length,
      page,
      total,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      data: {
        bookmarks: sanitizedBookmarks,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`User bookmarks API error for user ${user.email}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while fetching bookmarks',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply enhanced CMS security middleware and error handler
export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'view:bookmarks',
  auditAction: 'user_bookmarks_accessed'
}));
                            
                        
