import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, getCMSRateLimit } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Enhanced validation schema for search parameters
const searchQuerySchema = z.object({
  q: z.string().regex(/^[^<>]{1,100}$/, 'Search query must be 1-100 characters and cannot contain HTML tags'),
  type: z.enum(['all', 'articles', 'comments', 'users']).default('all'),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  category: z.string().regex(/^[^<>]*$/, 'Category cannot contain HTML tags').optional(),
  sort: z.enum(['relevance', 'date', 'views', 'likes']).default('relevance')
});

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image?: string;
  published_at: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  author: {
    name: string;
    avatar_url?: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    name: string;
    avatar_url?: string;
  };
  article: {
    id: string;
    title: string;
    slug: string;
  };
}

interface User {
  id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  role: string;
  created_at: string;
}

interface SearchResults {
  articles: Article[];
  comments: Comment[];
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Apply public-friendly rate limiting
    const rateLimit = getCMSRateLimit('GET');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Log public search access
    console.log(`Public search API accessed`, {
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
    }

    // Validate search parameters
    const validatedQuery = searchQuerySchema.parse(req.query);
    const { q, type, page, limit, sort } = validatedQuery;

    const searchTerm = q.trim();
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    const results: SearchResults = {
      articles: [],
      comments: [],
      users: [],
      pagination: {
        currentPage: pageNum,
        totalPages: 0,
        totalResults: 0,
      }
    };

    let totalResults = 0;

    // Search published articles only
    if (type === 'all' || type === 'articles') {
      const supabaseAdmin = await getSupabaseAdmin();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let articlesQuery = (await supabaseAdmin as any)
        .from('articles')
        .select(`
          id, title, slug, excerpt, featured_image, published_at,
          views_count, likes_count, comments_count,
          author:users(name, avatar_url),
          contributor_name
        `, { count: 'exact' })
        .eq('status', 'published');

      // Apply search filter
      articlesQuery = articlesQuery.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`);

      // Apply sorting
      if (sort === 'date') {
        articlesQuery = articlesQuery.order('published_at', { ascending: false });
      } else if (sort === 'views') {
        articlesQuery = articlesQuery.order('views_count', { ascending: false });
      } else if (sort === 'likes') {
        articlesQuery = articlesQuery.order('likes_count', { ascending: false });
      } else {
        // Default to relevance (published_at for now)
        articlesQuery = articlesQuery.order('published_at', { ascending: false });
      }

      // Apply pagination
      articlesQuery = articlesQuery.range(offset, offset + limitNum - 1);

      const { data: articles, error: articlesError, count: articlesCount } = await articlesQuery;

      if (!articlesError && articles) {
        // Sanitize article data for public consumption
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        results.articles = articles.map((article: any) => ({
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          featured_image: article.featured_image,
          published_at: article.published_at,
          views_count: article.views_count || 0,
          likes_count: article.likes_count || 0,
          comments_count: article.comments_count || 0,
          bookmarks_count: 0, // Not exposed to public
          author: article.contributor_name ? {
            name: article.contributor_name,
            avatar_url: undefined
          } : (article.author && Array.isArray(article.author) && article.author.length > 0 ? {
            name: article.author[0].name,
            avatar_url: article.author[0].avatar_url
          } : { name: 'UPSA Contributor' })
        }));
        totalResults += articlesCount || 0;
      }
    }

    // Calculate pagination
    const totalPages = Math.ceil(totalResults / limitNum);
    results.pagination.totalPages = totalPages;
    results.pagination.totalResults = totalResults;

    // Log successful search
    console.log(`Public search completed successfully`, {
      searchTerm,
      type,
      resultsCount: totalResults,
      page: pageNum,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Public search API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while searching',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Search handler with CMS security
const handlerWithCMS = withCMSSecurity(
  handler,
  { requirePermission: 'view:content', auditAction: 'search_content' }
);

// Apply enhanced error handler
export default withErrorHandler(handlerWithCMS);
                    
