import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, getCMSRateLimit, CMSUser } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Enhanced validation schema with security constraints
const commentsQuerySchema = z.object({
  search: z.string().max(100, 'Search term too long').optional(),
  status: z.enum(['all', 'pending', 'approved', 'rejected', 'spam']).default('all'),
  page: z.coerce.number().min(1).max(100, 'Page number too high').default(1)
});

// Define comment interface for better type safety
interface CommentData {
  id: string;
  content: string;
  name: string;
  email: string;
  article_id: string;
  status: string;
  created_at: string;
  updated_at?: string;
  admin_notes?: string;
  user?: {
    name: string;
    email: string;
  };
  article?: {
    title: string;
    slug: string;
  };
  [key: string]: unknown;
}

async function handler(req: NextApiRequest, res: NextApiResponse, user: CMSUser) {
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
    // Apply rate limiting for comments access
    const rateLimit = getCMSRateLimit('GET');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Log comments access
    console.log(`Admin comments accessed by user: ${user.email} (${user.id})`, {
      timestamp: new Date().toISOString(),
      securityLevel: user.securityLevel
    });

  // Validate query parameters
    const validatedParams = commentsQuerySchema.parse(req.query);
    const { search, status, page } = validatedParams;

    const pageNum = page;
    const limit = 20;
    const offset = (pageNum - 1) * limit;

    let query = supabaseAdmin
      .from('comments')
      .select(`
        *,
        user:users(name, email),
        article:articles(title, slug)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Add search filter with SQL injection protection
    if (search && typeof search === 'string') {
      const sanitizedSearch = search.replace(/[%_]/g, '\\$&');
      query = query.or(`content.ilike.%${sanitizedSearch}%,name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%`);
    }

    // Add status filter
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error(`Comments fetch failed for admin ${user.email}:`, error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'COMMENTS_FETCH_FAILED',
          message: 'Failed to fetch comments',
          details: process.env.NODE_ENV === 'development' ? error.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Sanitize comment data before returning
    const sanitizedComments = (data || []).map((comment: CommentData) =>({
      id: comment.id,
      content: comment.content,
      name: comment.name,
      email: comment.email,
      status: comment.status,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      user: comment.user ? {
        name: comment.user.name,
        email: comment.user.email
      } : null,
      article: comment.article ? {
        title: comment.article.title,
        slug: comment.article.slug
      } : null,
      // Remove sensitive fields
      ip_address: undefined,
      user_agent: undefined
    }));

    console.log(`Comments list returned to admin: ${user.email}`, {
      commentCount: sanitizedComments.length,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      data: {
        comments: sanitizedComments,
        pagination: {
          page: pageNum,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      },
      timestamp: new Date().toISOString()
    });
          } catch (error) {
    console.error(`Comments API error for admin ${user.email}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while fetching comments',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply enhanced CMS security middleware and error handler
export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'manage:comments',
  auditAction: 'comments_accessed'
}));

  
