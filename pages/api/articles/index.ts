import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { getCMSRateLimit } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Enhanced validation schema for query parameters
const articlesQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('12'),
  search: z.string().regex(/^[^<>]*$/, 'Search term cannot contain HTML tags').optional(),
  status: z.enum(['published', 'draft', 'archived']).default('published'),
  category: z.string().regex(/^[^<>]*$/, 'Category cannot contain HTML tags').optional(),
  author: z.string().regex(/^[^<>]*$/, 'Author cannot contain HTML tags').optional(),
  sort: z.enum(['published_at', 'created_at', 'updated_at', 'views_count', 'likes_count', 'comments_count']).default('published_at'),
  order: z.enum(['asc', 'desc']).default('desc')
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Apply public-friendly rate limiting
    const rateLimit = getCMSRateLimit('GET');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Log public articles access
    console.log(`Public articles API accessed`, {
      method: req.method,
      query: req.query,
      ip: getClientIP(req),
      timestamp: new Date().toISOString()
    });

    // Only allow GET for public access
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only GET method is allowed for public access',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    // Validate query parameters
    const validatedQuery = articlesQuerySchema.parse(req.query);
    const { page, limit, search, author, sort, order } = validatedQuery;

    // Build query
    let query = supabaseAdmin
      .from('articles')
      .select('id, title, slug, excerpt, featured_image, status, published_at, created_at, updated_at, views_count, likes_count, comments_count, display_location, is_featured, featured_order, featured_until, author:users(id, name, avatar_url)', { count: 'exact' })
      .eq('status', 'published') // Only show published articles to public
      .eq('blocked', false) // Don't show blocked articles
      .order(sort, { ascending: order === 'asc' });

    // Apply filters
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }
    // Remove category filter since column doesn't exist
    if (author) {
      query = query.eq('author.name', author);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: articles, error, count } = await query;

    if (error) {
      console.error('Public articles query error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: 'Failed to fetch articles',
          details: process.env.NODE_ENV === 'development' ? error?.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Sanitize article data for public consumption
    const sanitizedArticles = articles?.map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      featured_image: article.featured_image,
      published_at: article.published_at,
      views_count: article.views_count,
      likes_count: article.likes_count,
      comments_count: article.comments_count,
      category: null, // Category field removed from database
      is_featured: article.is_featured || false,
      featured_order: article.featured_order,
      featured_until: article.featured_until,
      author: article.author && Array.isArray(article.author) && article.author.length > 0 ? {
        id: article.author[0].id,
        name: article.author[0].name,
        avatar_url: article.author[0].avatar_url
      } : null
    })) || [];

    // Log successful fetch
    console.log(`Public articles fetched successfully`, {
      articlesCount: sanitizedArticles.length,
      totalCount: count || 0,
      page,
      limit,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      data: {
        articles: sanitizedArticles,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      },
      timestamp: new Date().toISOString()
    });
    }
  } catch (error) {
    console.error('Public articles API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while fetching articles',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply enhanced error handler
export default withErrorHandler(handler);
                                          
    
    
          
