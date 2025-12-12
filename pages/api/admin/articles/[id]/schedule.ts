import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';
import { z } from 'zod';

// Enhanced validation schema for article scheduling
const updateScheduleSchema = z.object({
  scheduled_at: z.string().datetime('Invalid datetime format').nullable(),
  timezone: z.string().min(1, 'Timezone is required').max(50, 'Timezone too long').default('UTC'),
  auto_publish: z.boolean().default(false)
});

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string; securityLevel?: string }) {
  try {
    // Only allow PUT for schedule updates
    if (req.method !== 'PUT') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only PUT method is allowed for schedule updates',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate article ID
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ARTICLE_ID',
          message: 'Valid article ID is required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate input with enhanced schema
    const validatedData = updateScheduleSchema.parse(req.body);
    const { scheduled_at, timezone, auto_publish } = validatedData;

    // Log admin schedule update action
    console.log(`Admin article schedule update initiated`, {
      adminId: user.id,
      adminEmail: user.email,
      articleId: id,
      scheduled_at,
      timezone,
      auto_publish,
      timestamp: new Date().toISOString()
    });

    // Verify article exists
    const { data: article, error: articleError } = await supabaseAdmin
      .from('articles')
      .select('id, title, scheduled_at, timezone, auto_publish, status')
      .eq('id', id)
      .single();

    if (articleError) {
      console.error('Admin schedule update - article fetch error:', articleError);
      return res.status(404).json({
        success: false,
        error: {
          code: 'ARTICLE_NOT_FOUND',
          message: 'Article not found',
          details: process.env.NODE_ENV === 'development' ? articleError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate scheduled_at is in future if provided
    if (scheduled_at) {
      const scheduledDate = new Date(scheduled_at);
      const now = new Date();
      
      if (scheduledDate <= now) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SCHEDULE_DATE',
            message: 'Scheduled date must be in the future',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    // Update article schedule
    const updateData = {
      scheduled_at,
      timezone,
      auto_publish,
      updated_at: new Date().toISOString()
    };

    const { data: updatedArticle, error: updateError } = await supabaseAdmin
      .from('articles')
      .update(updateData)
      .eq('id', id)
      .select(`
        id, title, scheduled_at, timezone, auto_publish, status, updated_at
      `)
      .single();

    if (updateError) {
      console.error('Admin schedule update error:', updateError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update article schedule',
          details: process.env.NODE_ENV === 'development' ? updateError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log successful schedule update
    console.log(`Admin article schedule updated successfully`, {
      adminId: user.id,
      articleId: id,
      articleTitle: article.title,
      oldSchedule: {
        scheduled_at: article.scheduled_at,
        timezone: article.timezone,
        auto_publish: article.auto_publish
      },
      newSchedule: validatedData,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Article schedule updated successfully',
      data: {
        article: updatedArticle,
        updated_by: user.id,
        updated_at: updatedArticle.updated_at
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin article schedule API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while updating article schedule',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply CMS security middleware and enhanced error handler
export default withErrorHandler(withCMSSecurity(handler));
    
        
