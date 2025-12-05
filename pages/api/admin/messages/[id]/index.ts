import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { z } from 'zod';

// Validation schema
const messageUpdateSchema = z.object({
  status: z.enum(['new', 'read', 'replied', 'in_progress', 'resolved', 'closed', 'archived']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assigned_to: z.string().uuid().optional().nullable()
});

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

  if (req.method !== 'PATCH') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only PATCH method is allowed',
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

    // Validate input
    const validatedData = messageUpdateSchema.parse(req.body);

    // Prepare update data
    const updateData = {
      ...validatedData,
      updated_at: new Date().toISOString()
    };

    // Add timestamps based on status change
    if (validatedData.status === 'read') {
      updateData.updated_at = new Date().toISOString();
    } else if (validatedData.status === 'replied') {
      updateData.updated_at = new Date().toISOString();
    }

    // Update message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: message, error: updateError } = await (supabaseAdmin as any)
      .from('contact_submissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating message:', updateError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'MESSAGE_UPDATE_FAILED',
          message: 'Failed to update message',
          details: updateError.message
        },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      data: message,
      message: 'Message updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Message update API error:', error);
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
