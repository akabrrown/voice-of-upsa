import { NextApiRequest, NextApiResponse } from 'next';
// import { supabaseAdmin } from '@/lib/database-server';
// import { withErrorHandler } from '@/lib/api/middleware/error-handler';
// import { getCMSRateLimit } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
// import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Define category interface for type safety
interface CategoryResult {
  id: string;
}

// Define Supabase query result interface
interface SupabaseResult<T> {
  data: T | null;
  error: { message: string } | null;
}

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

async function handler(req: NextApiRequest, res: NextApiResponse, user?: { id: string; email: string; role: string; permissions: string[] }) {
  try {
    // Apply rate limiting (temporarily disabled due to import issue)
    // const rateLimit = getCMSRateLimit('GET');
    // const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
    //   getClientIP(req)
    // );
    // rateLimitMiddleware(req);

    // Log articles access with user info
    console.log(`Articles API accessed`, {
      method: req.method,
      query: req.query,
      user: user ? { id: user.id, role: user.role } : 'anonymous',
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
          details: undefined
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate query parameters
    const validatedQuery = articlesQuerySchema.parse(req.query);
    const { page, limit, search, status, category, author, sort, order } = validatedQuery;

    // Get supabase admin client
    const admin = await import('@/lib/database-server').then(m => m.getSupabaseAdmin());

    // Build base query with author and category joins
    let query = admin
      .from('articles')
      .select(`
        id, 
        title, 
        slug, 
        excerpt, 
        featured_image, 
        published_at, 
        created_at, 
        views_count, 
        likes_count, 
        comments_count, 
        status, 
        is_featured,
        featured_order,
        featured_until,
        author_id,
        category_id,
        users (
          id,
          name,
          email,
          avatar_url
        ),
        categories (
          id,
          name,
          slug,
          description
        ),
        contributor_name
      `, { count: 'exact' });

    // Apply role-based filtering
    if (user) {
      // Authenticated users can see more content based on their role
      if (user.role === 'admin') {
        // Admins can see all articles regardless of status
        if (status && status !== 'published') {
          query = query.eq('status', status);
        }
      } else if (user.role === 'editor') {
        // Editors can see published articles and their own drafts
        if (status === 'published') {
          query = query.eq('status', 'published');
        } else if (status === 'draft') {
          query = query.or(`status.eq.published,and(author_id.eq.${user.id},status.eq.draft)`);;
        } else {
          query = query.or(`status.eq.published,author_id.eq.${user.id}`);
        }
      } else {
        // Regular users can only see published articles
        query = query.eq('status', 'published');
      }
    } else {
      // Anonymous users can only see published articles
      query = query.eq('status', 'published');
    }

    // Apply search filter
    // Apply filters
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }
    // Author filter removed since we're not joining users table

    // Apply category filter
    if (category) {
      console.log('Filtering by category slug:', category);
      // First get the category ID
      const categoryResult = await admin
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single() as SupabaseResult<CategoryResult>;
      
      if (categoryResult.data) {
        console.log('Found category ID:', categoryResult.data.id);
        // Then filter articles by category_id
        query = query.eq('category_id', categoryResult.data.id);
        console.log('Applied category filter by category_id');
      } else {
        console.log('Category not found, returning empty results');
        return res.status(200).json({
          success: true,
          data: {
            articles: [],
            pagination: {
              page: 1,
              limit: limit,
              total: 0,
              totalPages: 0
            }
          },
          timestamp: new Date().toISOString()
        });
      }
    } else {
      console.log('No category filter applied - showing all articles');
    }

    // Apply author filter (only for admins or editors viewing their own content)
    if (author && (user?.role === 'admin' || (user?.role === 'editor' && author === user.id))) {
      query = query.eq('author_id', author);
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' });

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
          details: process.env.NODE_ENV === 'development' ? error?.message : undefined
        },
        timestamp: new Date().toISOString()
      });
    }

    // Debug: Log the articles data with category information
    console.log('Articles fetched with category data:', articles?.slice(0, 1));

    // Sanitize article data for public consumption with author information
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sanitizedArticles = articles?.map((article: any) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      featured_image: article.featured_image,
      published_at: article.published_at,
      created_at: article.created_at,
      views_count: article.views_count || 0,
      likes_count: article.likes_count || 0,
      comments_count: article.comments_count || 0,
      status: article.status,
      contributor_name: article.contributor_name,
      is_featured: article.is_featured || false,
      featured_order: article.featured_order || null,
      featured_until: article.featured_until || null,
      author: article.contributor_name ? {
        id: '', 
        name: article.contributor_name,
        email: '',
        avatar_url: undefined
      } : (article.users ? {
        id: article.users.id,
        name: article.users.name,
        email: article.users.email,
        avatar_url: article.users.avatar_url
      } : null),
      categories: article.categories ? {
        id: article.categories.id,
        name: article.categories.name,
        slug: article.categories.slug
      } : null
    })) || [];

    // Log successful fetch with detailed debugging
    console.log(`Public articles fetched successfully`, {
      articlesCount: sanitizedArticles.length,
      totalCount: count || 0,
      page,
      limit,
      timestamp: new Date().toISOString(),
      rawArticles: articles?.slice(0, 2), // Log first 2 raw articles
      sanitizedArticles: sanitizedArticles?.slice(0, 2), // Log first 2 sanitized articles
      hasData: !!sanitizedArticles && sanitizedArticles.length > 0
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
  } catch (error) {
    console.error('Articles API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while fetching articles',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Export handler directly (no CMS security - allows public access)
export default handler;
                                          
    
    
          
