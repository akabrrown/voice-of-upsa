import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, getCMSRateLimit, CMSUser } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { requireAdminOrEditor } from '@/lib/auth-helpers';
import { z } from 'zod';

// Simple HTML sanitization function (fallback if DOMPurify not available)
const sanitizeHTML = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<video\b[^<]*(?:(?!<\/video>)<[^<]*)*<\/video>/gi, '')
    .replace(/<audio\b[^<]*(?:(?!<\/audio>)<[^<]*)*<\/audio>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/data:/gi, ''); // Remove data: URLs
};

// Enhanced validation schemas with security constraints
const articlesQuerySchema = z.object({
  search: z.string().max(100, 'Search term too long').optional(),
  status: z.enum(['all', 'draft', 'pending_review', 'published', 'archived']).default('all'),
  page: z.coerce.number().min(1).max(100, 'Page number too high').default(1)
});

const articleCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must not exceed 255 characters')
    .regex(/^[^<>]*$/, 'Title cannot contain HTML tags'),
  content: z.string().min(1, 'Content is required').max(100000, 'Content too long'),
  excerpt: z.string().max(500, 'Excerpt must not exceed 500 characters').optional(),
  featured_image: z.string().url('Invalid featured image URL').optional().nullable(),
  status: z.enum(['draft', 'pending_review', 'published']).default('draft'),
  is_featured: z.boolean().default(false),
  featured_order: z.number().min(0).max(1000, 'Featured order too high').default(0),
  display_location: z.enum(['homepage', 'category_page', 'both', 'none']).default('both')
});

async function handler(req: NextApiRequest, res: NextApiResponse, user: CMSUser) {
  console.log('Admin Articles API [index] reached:', {
    method: req.method,
    url: req.url,
    query: req.query,
    timestamp: new Date().toISOString()
  });
  try {
    // Server-side role check - double security
    await requireAdminOrEditor(req);

    // Get supabase admin client
    const supabaseAdmin = await getSupabaseAdmin();
    if (!supabaseAdmin) {
      throw new Error('Database connection failed');
    }

    // Apply rate limiting based on method
    const rateLimit = getCMSRateLimit(req.method || 'GET');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    console.log(`Admin articles API accessed by user: ${user.email} (${user.id})`, {
      method: req.method,
      timestamp: new Date().toISOString(),
      securityLevel: user.securityLevel
    });

    // GET - List articles
    if (req.method === 'GET') {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (await supabaseAdmin as any)
        .from('articles')
        .select('*, author:users!author_id(name, email)', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Add search filter with SQL injection protection
      if (search && typeof search === 'string') {
        console.log('Adding search filter:', search);
        // Sanitize search term
        const sanitizedSearch = search.replace(/[%_]/g, '\\$&');
        query = query.or(`title.ilike.%${sanitizedSearch}%,content.ilike.%${sanitizedSearch}%,excerpt.ilike.%${sanitizedSearch}%`);
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          articles: (data || []).map((article: any) => ({
            ...article,
            author_name: article.contributor_name || article.author?.name || 'Unknown',
            author_email: article.author?.email || 'Unknown'
          })),
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
        content: sanitizeHTML(content),
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
      const { data: article, error } = await (await supabaseAdmin as any)
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
          details: process.env.NODE_ENV === 'development' ? dbError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Generic error handling
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing articles',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Wrap with enhanced CMS security middleware and error handler
export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'manage:content',
  auditAction: 'articles_accessed'
}));
