import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { authenticate, checkRole } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Validation schema for query parameters
const commentsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1)
});

// Rate limiting: 25 requests per minute per admin
const rateLimitMiddleware = withRateLimit(25, 60 * 1000, (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return token || req.socket.remoteAddress || 'unknown';
});

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
    // Apply rate limiting
    rateLimitMiddleware(req);

    // Authenticate user
    const user = await authenticate(req);

    // Authorize admin access
    if (!checkRole(user.role, ['admin'])) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate query parameters
    const validatedParams = commentsQuerySchema.parse(req.query);
    const { page } = validatedParams;

    const pageNum = page;
    const limitNum = 20;
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('comments')
      .select(`
        *,
        user:users(name, email),
        article:articles(title, slug)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    query = query.range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching comments:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'COMMENTS_FETCH_FAILED',
          message: 'Failed to fetch comments',
          details: error.message
        },
        timestamp: new Date().toISOString()
      });
    }

    // Transform data to flatten nested objects
    const transformedData = data?.map(comment => ({
      ...comment,
      user_name: comment.user?.name || 'Unknown',
      user_email: comment.user?.email || '',
      article_title: comment.article?.title || 'Unknown Article',
      article_slug: comment.article?.slug || '',
    })) || [];

    // Log admin comment list access
    console.info(`Admin comment list accessed by: ${user.id}`, {
      page,
      totalComments: count,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      data: {
        comments: transformedData,
        pagination: {
          currentPage: pageNum,
          totalPages: count ? Math.ceil(count / limitNum) : 0,
          totalComments: count || 0,
          hasNextPage: (offset + limitNum) < (count || 0),
          hasPreviousPage: pageNum > 1
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('Admin comments API error:', error);
    
    // Type guard for error objects
    const isError = (err: unknown): err is { statusCode?: number; message?: string; code?: string; stack?: string } => {
      return typeof err === 'object' && err !== null;
    };
    
    const statusCode = isError(error) && error.statusCode ? error.statusCode : 500;
    const message = isError(error) && error.message ? error.message : 'An unexpected error occurred while fetching comments';
    const errorCode = isError(error) && error.code ? error.code : 'INTERNAL_SERVER_ERROR';
    const errorStack = isError(error) && error.stack ? error.stack : undefined;
    
    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: message,
        details: process.env.NODE_ENV === 'development' ? errorStack : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Wrap with error handler middleware
export default withErrorHandler(handler);

