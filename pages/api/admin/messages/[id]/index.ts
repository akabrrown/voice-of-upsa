import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, getCMSRateLimit, CMSUser } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Enhanced validation schema with security constraints
const messageUpdateSchema = z.object({
  status: z.enum(['new', 'read', 'replied', 'in_progress', 'resolved', 'closed', 'archived']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assigned_to: z.string().uuid().optional().nullable(),
  admin_notes: z.string().max(1000, 'Admin notes too long').optional()
});

async function handler(req: NextApiRequest, res: NextApiResponse, user: CMSUser) {
  try {
    // Apply rate limiting based on method
    const rateLimit = getCMSRateLimit(req.method || 'GET');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Log message access
    console.log(`Admin message [${req.query.id}] accessed by user: ${user.email} (${user.id})`, {
      method: req.method,
      timestamp: new Date().toISOString(),
      securityLevel: user.securityLevel
    });

    // Validate message ID
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MESSAGE_ID',
          message: 'Valid message ID is required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // GET - Fetch single message
    if (req.method === 'GET') {
      const supabaseAdmin = await getSupabaseAdmin();
      const { data, error } = await (await supabaseAdmin as any)
        .from('contact_messages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Message fetch failed for admin ${user.email}:`, error);
        return res.status(404).json({
          success: false,
          error: {
            code: 'MESSAGE_NOT_FOUND',
            message: 'Message not found',
            details: process.env.NODE_ENV === 'development' ? error.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Sanitize message data
      const sanitizedMessage = {
        id: data.id,
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        status: data.status,
        priority: data.priority,
        assigned_to: data.assigned_to,
        admin_notes: data.admin_notes,
        created_at: data.created_at,
        updated_at: data.updated_at,
        // Remove sensitive fields
        ip_address: undefined,
        user_agent: undefined
      };

      console.log(`Message [${id}] returned to admin: ${user.email}`, {
        subject: data.subject,
        status: data.status,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { message: sanitizedMessage },
        timestamp: new Date().toISOString()
      });
    }
      // PATCH - Update message
    if (req.method === 'PATCH') {
      // Validate input
      const validatedData = messageUpdateSchema.parse(req.body);

      // Get message to ensure it exists
      const supabaseAdmin = await getSupabaseAdmin();
      const { data: existingMessage, error: fetchError } = await (await supabaseAdmin as any)
        .from('contact_messages')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingMessage) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'MESSAGE_NOT_FOUND',
            message: 'Message not found',
            details: process.env.NODE_ENV === 'development' ? fetchError?.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Update message
      const { data: updatedMessage, error } = await (await supabaseAdmin as any)
        .from('contact_messages')
        .update(validatedData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error(`Message update failed for admin ${user.email}:`, error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'MESSAGE_UPDATE_FAILED',
            message: 'Failed to update message',
            details: process.env.NODE_ENV === 'development' ? error.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Sanitize updated message
      const sanitizedMessage = {
        id: updatedMessage.id,
        name: updatedMessage.name,
        email: updatedMessage.email,
        subject: updatedMessage.subject,
        message: updatedMessage.message,
        status: updatedMessage.status,
        priority: updatedMessage.priority,
        assigned_to: updatedMessage.assigned_to,
        admin_notes: updatedMessage.admin_notes,
        created_at: updatedMessage.created_at,
        updated_at: updatedMessage.updated_at,
        // Remove sensitive fields
        ip_address: undefined,
        user_agent: undefined
      };

      // Log message update
      console.info(`Message updated by admin: ${user.email}`, {
        messageId: id,
        subject: updatedMessage.subject,
        changes: validatedData,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { message: sanitizedMessage },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET and PATCH methods are allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Message API error for admin ${user.email}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing message request',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply enhanced CMS security middleware and error handler
export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'manage:messages',
  auditAction: 'message_accessed'
}));
