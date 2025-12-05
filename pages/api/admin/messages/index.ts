import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { z } from 'zod';

// Validation schemas
const messagesQuerySchema = z.object({
  search: z.string().max(100, 'Search term too long').optional(),
  status: z.enum(['all', 'new', 'read', 'replied', 'in_progress', 'resolved', 'closed', 'archived']).default('all'),
  priority: z.enum(['all', 'low', 'normal', 'high', 'urgent']).default('all'),
  page: z.coerce.number().min(1).default(1)
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Authenticate user using admin client
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid authentication token',
          details: authError?.message
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if user is admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData, error: userError } = await (supabaseAdmin as any)
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Admin access required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // GET - List messages
    if (req.method === 'GET') {
      // Validate query parameters
      const validatedParams = messagesQuerySchema.parse(req.query);
      const { search, status, priority, page } = validatedParams;

      const pageNum = page;
      const limit = 20;
      const offset = (pageNum - 1) * limit;

      let query = supabaseAdmin
        .from('contact_submissions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Add search filter
      if (search && typeof search === 'string') {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`);
      }

      // Add status filter
      if (status !== 'all') {
        query = query.eq('status', status);
      }

      // Add priority filter
      if (priority !== 'all') {
        query = query.eq('priority', priority);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error, count } = await (query as any);

      if (error) {
        console.error('Error fetching messages:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'MESSAGES_FETCH_FAILED',
            message: 'Failed to fetch messages',
            details: error.message
          },
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          messages: data || [],
          pagination: {
            page: pageNum,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          }
        },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET method is allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Messages API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(handler);
