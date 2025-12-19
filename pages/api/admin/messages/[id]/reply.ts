import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, getCMSRateLimit, CMSUser } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { sendReplyEmail } from '@/lib/email-service';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Enhanced validation schema with security constraints
const replySchema = z.object({
  reply_message: z.string().min(10, 'Reply message must be at least 10 characters')
    .max(2000, 'Reply message too long')
    .regex(/^[^<>]*$/, 'Reply cannot contain HTML tags'),
  send_email: z.boolean().default(true)
});

async function handler(req: NextApiRequest, res: NextApiResponse, user: CMSUser) {
  try {
    // Apply rate limiting for reply operations
    const rateLimit = getCMSRateLimit('POST');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Log message reply access
    console.log(`Admin message reply [${req.query.id}] accessed by user: ${user.email} (${user.id})`, {
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

    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only POST method is allowed',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

  // Validate input
    const validatedData = replySchema.parse(req.body);
    const { reply_message, send_email } = validatedData;

    // Get message to ensure it exists
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: message, error: fetchError } = await (await supabaseAdmin as any)
      .from('contact_messages')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !message) {
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

    // Create reply record
    const { data: reply, error: replyError } = await (await supabaseAdmin as any)
      .from('message_replies')
      .insert({
        message_id: id,
        admin_id: user.id,
        reply_message: reply_message,
        send_email: send_email,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (replyError) {
      console.error(`Reply creation failed for admin ${user.email}:`, replyError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'REPLY_CREATION_FAILED',
          message: 'Failed to create reply',
          details: process.env.NODE_ENV === 'development' ? replyError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Update message status to 'replied'
    const { error: updateError } = await (await supabaseAdmin as any)
      .from('contact_messages')
      .update({
        status: 'replied',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error(`Message status update failed for admin ${user.email}:`, updateError);
    }

    // Send email reply if requested
    if (send_email && message.email) {
      try {
        await sendReplyEmail({
          to: message.email,
          replyText: reply_message,
          originalSubject: message.subject || 'No Subject',
          adminName: user.email
        });
        console.log(`Reply email sent to ${message.email} by admin: ${user.email}`);
      } catch (emailError) {
        console.error(`Failed to send reply email to ${message.email}:`, emailError);
      }
    }

    // Log reply creation
    console.info(`Message reply created by admin: ${user.email}`, {
      messageId: id,
      replyId: reply.id,
      recipientEmail: message.email,
      sendEmail: send_email,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      data: { reply },
      message: 'Reply created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Message reply API error for admin ${user.email}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing reply request',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply enhanced CMS security middleware and error handler
export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'manage:messages',
  auditAction: 'message_replied'
}));
