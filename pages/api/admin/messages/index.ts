import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { getCMSRateLimit } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Enhanced validation schema for messages query
const messagesQuerySchema = z.object({
  status: z.enum(['all', 'new', 'in_progress', 'resolved', 'closed', 'pending', 'read', 'replied', 'archived']).default('all'),
  priority: z.enum(['all', 'low', 'normal', 'high', 'urgent']).default('all'),
  page: z.coerce.number().min(1).max(100, 'Page number too high').default(1),
  search: z.string().max(100, 'Search term too long').optional()
});

// Type for message data from database
interface MessageData {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  phone: string | null;
  status: 'new' | 'in_progress' | 'resolved' | 'closed' | 'pending' | 'read' | 'replied' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_to: string | null;
  ip_address: string | null;
  user_agent: string | null;
  read_at: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
}

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
    const rateLimit = getCMSRateLimit('GET');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Validate query parameters
    const validatedParams = messagesQuerySchema.parse(req.query);
    const { status, priority, page, search } = validatedParams;

    const pageNum = page;
    const limit = 20;
    const offset = (pageNum - 1) * limit;

    const supabaseAdmin = await getSupabaseAdmin();
    let query = supabaseAdmin
      .from('contact_messages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Add status filter
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Add priority filter
    if (priority !== 'all') {
      query = query.eq('priority', priority);
    }

    // Add search filter
    if (search && typeof search === 'string') {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Messages fetch failed:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'MESSAGES_FETCH_FAILED',
          message: 'Failed to fetch messages',
          details: process.env.NODE_ENV === 'development' ? error.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Sanitize data for frontend (remove sensitive fields)
    const sanitizedMessages = (data || []).map((msg: MessageData) => ({
      ...msg,
      ip_address: undefined,
      user_agent: undefined
    }));

    console.log('Messages list returned:', {
      messageCount: sanitizedMessages.length,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      data: {
        messages: sanitizedMessages,
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
    console.error('Messages API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while fetching messages',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply enhanced error handler
export default withErrorHandler(handler);