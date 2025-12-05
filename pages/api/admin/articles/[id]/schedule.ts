import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { z } from 'zod';

// Validation schema
const updateScheduleSchema = z.object({
  scheduled_at: z.string().datetime().nullable(),
  timezone: z.string().default('UTC'),
  auto_publish: z.boolean().default(false),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only PUT method is allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Article ID is required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

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
    const { data: userData, error: userError } = await supabaseAdmin
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
    const validatedData = updateScheduleSchema.parse(req.body);

    // Update article schedule
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: article, error: updateError } = await (supabaseAdmin as any)
      .from('articles')
      .update({
        scheduled_at: validatedData.scheduled_at,
        timezone: validatedData.timezone,
        auto_publish: validatedData.auto_publish,
        updated_at: new Date().toISOString(),
        // If scheduling for publication, set status to draft
        status: validatedData.scheduled_at ? 'draft' : 'published'
      })
      .eq('id', id)
      .select(`
        *,
        category:categories(id, name, slug)
      `)
      .single();

    if (updateError) {
      console.error('Error updating schedule:', updateError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update article schedule',
          details: updateError.message
        },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      article,
      message: 'Article schedule updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Schedule API error:', error);
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
