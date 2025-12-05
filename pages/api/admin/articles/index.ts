import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { AuthenticationError } from '@/lib/api/middleware/error-handler';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Validation schemas
const articlesQuerySchema = z.object({
  search: z.string().max(100, 'Search term too long').optional(),
  status: z.enum(['all', 'draft', 'pending_review', 'published', 'archived']).default('all'),
  page: z.coerce.number().min(1).default(1)
});

const articleCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must not exceed 255 characters'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt must not exceed 500 characters').optional(),
  featured_image: z.string().url('Invalid featured image URL').optional().nullable(),
  status: z.enum(['draft', 'pending_review', 'published']).default('draft'),
  is_featured: z.boolean().default(false),
  featured_order: z.number().min(0).default(0),
  display_location: z.enum(['homepage', 'category_page', 'both', 'none']).default('both')
});

// Rate limiting: 30 requests per minute per admin
const rateLimitMiddleware = withRateLimit(30, 60 * 1000, (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return token || req.socket.remoteAddress || 'unknown';
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('=== ADMIN ARTICLES API DEBUG ===');
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    console.log('Query:', req.query);
    console.log('Body:', req.body);
    
    // Apply rate limiting
    console.log('Applying rate limiting...');
    rateLimitMiddleware(req);
    console.log('Rate limiting passed');

    // Authenticate user using admin client directly
    console.log('Authenticating user...');
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
      console.log('Auth failed:', authError?.message);
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

    // Get user role from database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (userError || !userData) {
      console.log('User role fetch failed:', userError?.message);
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    const user = {
      id: authUser.id,
      email: authUser.email,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      role: (userData as any).role
    };
    console.log('User authenticated:', { userId: user.id, role: user.role });

    // GET - List articles
    if (req.method === 'GET') {
      console.log('Processing GET request for articles...');
      
      // Authorize admin or editor access
      if (!['admin', 'editor'].includes(user.role)) {
        console.log('Access denied - insufficient permissions:', user.role);
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Admin or editor access required',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Validate query parameters
      console.log('Validating query parameters...');
      const validatedParams = articlesQuerySchema.parse(req.query);
      const { search, status, page } = validatedParams;
      console.log('Validated params:', { search, status, page });

      const pageNum = page;
      const limit = 12;
      const offset = (pageNum - 1) * limit;
      console.log('Pagination:', { pageNum, limit, offset });

      console.log('Building database query...');
      let query = supabaseAdmin
        .from('articles')
        .select(`
          *,
          author:users(name, email),
          category:categories(id, name, slug)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Add search filter
      if (search && typeof search === 'string') {
        console.log('Adding search filter:', search);
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`);
      }

      // Add status filter
      if (status !== 'all') {
        console.log('Adding status filter:', status);
        query = query.eq('status', status);
      }

      // Apply pagination
      console.log('Applying pagination range...');
      query = query.range(offset, offset + limit - 1);

      console.log('Executing database query...');
      const { data, error, count } = await query;
      console.log('Query result:', { dataCount: data?.length || 0, error: error?.message, count });

      if (error) {
        console.error('Error fetching articles:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'ARTICLES_FETCH_FAILED',
            message: 'Failed to fetch articles',
            details: error.message
          },
          timestamp: new Date().toISOString()
        });
      }

      // Log admin article list access
      console.info(`Admin article list accessed by: ${user.id}`, {
        filters: { search, status, page },
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: {
          articles: data || [],
          pagination: {
            currentPage: pageNum,
            totalPages: count ? Math.ceil(count / limit) : 0,
            totalArticles: count || 0,
            hasNextPage: (offset + limit) < (count || 0),
            hasPreviousPage: pageNum > 1
          }
        },
        timestamp: new Date().toISOString()
      });
    }

    // POST - Create article
    if (req.method === 'POST') {
      // Authorize admin or editor access
      if (!['admin', 'editor'].includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Admin or editor access required to create articles',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Validate input
      articleCreateSchema.parse(req.body);
      const { title, content, excerpt, featured_image, status, is_featured, featured_order, display_location } = req.body;

      // Generate slug
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const articleData = {
        title,
        slug,
        content,
        excerpt: excerpt || '',
        featured_image: featured_image || null,
        status,
        is_featured: is_featured || false,
        featured_order: featured_order || 0,
        display_location: display_location || 'both',
        author_id: user.id,
        published_at: status === 'published' ? new Date().toISOString() : null,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: article, error } = await (supabaseAdmin as any)
        .from('articles')
        .insert(articleData)
        .select(`
          *,
          author:users(name)
        `)
        .single();

      if (error) {
        console.error('Error creating article:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'ARTICLE_CREATION_FAILED',
            message: 'Failed to create article',
            details: error.message
          },
          timestamp: new Date().toISOString()
        });
      }

      // Log article creation
      console.info(`Article created by admin/editor: ${user.id}`, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        articleId: (article as any).id,
        articleTitle: title,
        status,
        timestamp: new Date().toISOString()
      });

      return res.status(201).json({
        success: true,
        data: { article },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET and POST methods are allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin articles API error:', error);
    
    // Handle specific error types
    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: error.message,
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input parameters',
          details: error.errors
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Handle database errors
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = error as { code: string; message: string; [key: string]: unknown };
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database operation failed',
          details: dbError.message
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Generic error
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing article request',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Wrap with error handler middleware
export default withErrorHandler(handler);

