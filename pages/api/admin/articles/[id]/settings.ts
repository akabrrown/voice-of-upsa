import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';
import { z } from 'zod';

// Enhanced validation schema for article settings
const updateSettingsSchema = z.object({
  allow_comments: z.boolean(),
  moderate_comments: z.boolean(),
  notify_on_publish: z.boolean(),
  content_warning: z.boolean(),
  age_restriction: z.boolean(),
  is_premium: z.boolean()
});

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string; securityLevel?: string }) {
  try {
    // Only allow PUT for settings updates
    if (req.method !== 'PUT') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only PUT method is allowed for settings updates',
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
    const validatedData = updateSettingsSchema.parse(req.body);

    // Log admin settings update action
    console.log(`Admin article settings update initiated`, {
      adminId: user.id,
      adminEmail: user.email,
      articleId: id,
      settings: validatedData,
      timestamp: new Date().toISOString()
    });

    // Verify article exists
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: article, error: articleError } = await (await supabaseAdmin as any)
      .from('articles')
      .select('id, title, allow_comments, moderate_comments, notify_on_publish, content_warning, age_restriction, is_premium')
      .eq('id', id)
      .single();

    if (articleError) {
      console.error('Admin settings update - article fetch error:', articleError);
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

    // Update article settings
    const { data: updatedArticle, error: updateError } = await (await supabaseAdmin as any)
      .from('articles')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id, title, allow_comments, moderate_comments, notify_on_publish, 
        content_warning, age_restriction, is_premium, updated_at
      `)
      .single();

    if (updateError) {
      console.error('Admin settings update error:', updateError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update article settings',
          details: process.env.NODE_ENV === 'development' ? updateError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log successful settings update
    console.log(`Admin article settings updated successfully`, {
      adminId: user.id,
      articleId: id,
      articleTitle: article.title,
      oldSettings: {
        allow_comments: article.allow_comments,
        moderate_comments: article.moderate_comments,
        notify_on_publish: article.notify_on_publish,
        content_warning: article.content_warning,
        age_restriction: article.age_restriction,
        is_premium: article.is_premium
      },
      newSettings: validatedData,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Article settings updated successfully',
      data: {
        article: updatedArticle,
        updated_by: user.id,
        updated_at: updatedArticle.updated_at
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin article settings API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while updating article settings',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply CMS security middleware and enhanced error handler
export default withErrorHandler(withCMSSecurity(handler));
