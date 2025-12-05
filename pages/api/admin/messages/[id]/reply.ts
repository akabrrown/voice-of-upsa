import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { sendReplyEmail } from '@/lib/email-service';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Message ID is required',
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

  try {
    // Authenticate user
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
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
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
      .eq('id', user.id)
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

    // Simple validation without zod
    const { reply_text, reply_method = 'email' } = req.body;
    
    if (!reply_text || typeof reply_text !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Reply text is required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    if (reply_text.length > 5000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Reply text is too long (max 5000 characters)',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    if (!['email', 'internal'].includes(reply_method)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid reply method',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Get the original message to send email reply
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: originalMessage, error: messageError } = await (supabaseAdmin as any)
      .from('contact_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (messageError || !originalMessage) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MESSAGE_NOT_FOUND',
          message: 'Original message not found',
          details: messageError?.message
        },
        timestamp: new Date().toISOString()
      });
    }

    // Create reply in database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reply, error: replyError } = await (supabaseAdmin as any)
      .from('message_replies')
      .insert({
        message_id: id,
        admin_id: user.id,
        reply_text: reply_text.trim(),
        reply_method: reply_method,
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (replyError) {
      console.error('Error creating reply:', replyError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'REPLY_CREATE_FAILED',
          message: 'Failed to create reply',
          details: replyError.message
        },
        timestamp: new Date().toISOString()
      });
    }

    // Update original message status to 'replied'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin as any)
      .from('contact_submissions')
      .update({
        status: 'replied',
        replied_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    // Send email reply if method is email
    if (reply_method === 'email') {
      try {
        const emailResult = await sendReplyEmail({
          to: originalMessage.email,
          replyText: reply_text.trim(),
          originalSubject: originalMessage.subject || undefined,
          adminName: user.user_metadata?.full_name || user.email || 'Admin'
        });
        
        if (emailResult.success) {
          console.info('Email reply sent successfully:', emailResult.messageId);
        } else {
          console.warn('Failed to send email reply:', emailResult.message);
          // Don't fail the request if email fails, but log it
        }
      } catch (emailError) {
        console.error('Error sending email reply:', emailError);
        // Don't fail the request if email fails, but log it
      }
    }

    return res.status(201).json({
      success: true,
      reply,
      message: 'Reply sent successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Reply API error:', error);
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
