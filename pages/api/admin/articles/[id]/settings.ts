import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { z } from 'zod';

// Validation schema
const updateSettingsSchema = z.object({
  allow_comments: z.boolean(),
  moderate_comments: z.boolean(),
  notify_on_publish: z.boolean(),
  content_warning: z.boolean(),
  age_restriction: z.boolean(),
  is_premium: z.boolean(),
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
    const validatedData = updateSettingsSchema.parse(req.body);

    // Update article settings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: article, error: updateError } = await (supabaseAdmin as any)
      .from('articles')
      .update({
        allow_comments: validatedData.allow_comments,
        moderate_comments: validatedData.moderate_comments,
        notify_on_publish: validatedData.notify_on_publish,
        content_warning: validatedData.content_warning,
        age_restriction: validatedData.age_restriction,
        is_premium: validatedData.is_premium,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        category:categories(id, name, slug)
      `)
      .single();

    if (updateError) {
      console.error('Error updating article settings:', updateError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update article settings',
          details: updateError.message
        },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      article,
      message: 'Article settings updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Article settings API error:', error);
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
