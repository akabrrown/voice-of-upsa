import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, getCMSRateLimit, CMSUser } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Enhanced validation schemas with security constraints
const messagesQuerySchema = z.object({
  search: z.string().max(100, 'Search term too long').optional(),
  status: z.enum(['all', 'new', 'read', 'replied', 'in_progress', 'resolved', 'closed', 'archived']).default('all'),
  priority: z.enum(['all', 'low', 'normal', 'high', 'urgent']).default('all'),
  page: z.coerce.number().min(1).max(100, 'Page number too high').default(1)
});

// Define message interface for better type safety
interface MessageData {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at?: string;
  assigned_to?: string;
  admin_notes?: string;
  [key: string]: unknown;
}

async function handler(req: NextApiRequest, res: NextApiResponse, user: CMSUser) {
  try {
    // Apply rate limiting for message access
    const rateLimit = getCMSRateLimit('GET');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Log messages access
    console.log(`Admin messages accessed by user: ${user.email} (${user.id})`, {
      method: req.method,
      timestamp: new Date().toISOString(),
      securityLevel: user.securityLevel
    });

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

      // Add search filter with SQL injection protection
      if (search && typeof search === 'string') {
        // Sanitize search term
        const sanitizedSearch = search.replace(/[%_]/g, '\\$&');
        query = query.or(`name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%,subject.ilike.%${sanitizedSearch}%,message.ilike.%${sanitizedSearch}%`);
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

      const { data, error, count } = await query;

      if (error) {
        console.error(`Messages fetch failed for admin ${user.email}:`, error);
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

      // Sanitize message data before returning
      const sanitizedMessages = (data || []).map((message: MessageData) => ({
        id: message.id,
        name: message.name,
        email: message.email,
        subject: message.subject,
        message: message.message,
        status: message.status,
        priority: message.priority,
        created_at: message.created_at,
        updated_at: message.updated_at,
        // Remove any sensitive fields if they exist
        ip_address: undefined,
        user_agent: undefined
      }));

      console.log(`Messages list returned to admin: ${user.email}`, {
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
    console.error(`Messages API error for admin ${user.email}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply enhanced CMS security middleware and error handler
export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'manage:messages',
  auditAction: 'messages_accessed'
}));
