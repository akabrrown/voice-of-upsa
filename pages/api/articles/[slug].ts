import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { getCMSRateLimit } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Enhanced validation schemas
const articleSlugSchema = z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format');


async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Apply public-friendly rate limiting
    const rateLimit = getCMSRateLimit(req.method || 'GET');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Log public article access
    console.log(`Public article API accessed`, {
      method: req.method,
      slug: req.query.slug,
      ip: getClientIP(req),
      timestamp: new Date().toISOString()
    });

    // Validate article slug
    const { slug } = req.query;
    
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SLUG',
          message: 'Valid article slug is required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate slug format
    const validatedSlug = articleSlugSchema.parse(slug);
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
    }

    // Check if the parameter is a slug (contains hyphens, letters) or ID (uuid format)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(validatedSlug);
    const queryField = isUuid ? 'id' : 'slug';

    // Fetch single published article
    const supabaseAdmin = await getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: article, error } = await (await supabaseAdmin as any)
      .from('articles')
      .select('id, title, slug, excerpt, content, featured_image, status, published_at, created_at, updated_at, views_count, likes_count, comments_count, display_location, contributor_name, author:users(id, name, avatar_url)')
      .eq(queryField, validatedSlug)
      .eq('status', 'published') // Only show published articles to public
      .single();

    if (error || !article) {
      console.log(`Article not found: ${validatedSlug}`, { error });
      return res.status(404).json({
        success: false,
        error: {
          code: 'ARTICLE_NOT_FOUND',
          message: 'Published article not found',
          details: process.env.NODE_ENV === 'development' ? error?.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Sanitize article data for public consumption
    const sanitizedArticle = {
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      featured_image: article.featured_image,
      published_at: article.published_at,
      created_at: article.created_at,
      updated_at: article.updated_at,
      views_count: article.views_count,
      likes_count: article.likes_count,
      comments_count: article.comments_count,
      contributor_name: article.contributor_name || null,
      category: null, // Category field removed from database
      author: article.contributor_name ? {
        id: '',
        name: article.contributor_name,
        avatar_url: undefined
      } : (article.author && Array.isArray(article.author) && article.author.length > 0 ? {
        id: article.author[0].id,
        name: article.author[0].name,
        avatar_url: article.author[0].avatar_url
      } : null)
    };

    // Log successful fetch
    console.log(`Public article fetched successfully`, {
      articleId: article.id,
      slug: article.slug,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      data: {
        article: sanitizedArticle
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Public article API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while fetching the article',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply enhanced error handler
export default withErrorHandler(handler);
