import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';
import { z } from 'zod';

// Enhanced validation schema for featured article updates
const updateFeaturedSchema = z.object({
  is_featured: z.boolean(),
  featured_order: z.number().min(0, 'Featured order must be non-negative').max(9999, 'Featured order must be less than 10000').optional(),
  featured_until: z.string().datetime('Invalid datetime format').optional()
});

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string; securityLevel?: string }) {
  try {
    // Only allow PUT for featured status updates
    if (req.method !== 'PUT') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only PUT method is allowed for featured status updates',
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
    const validatedData = updateFeaturedSchema.parse(req.body);
    const { is_featured, featured_order, featured_until } = validatedData;

    // Log admin featured status update action
    console.log(`Admin article featured status update initiated`, {
      adminId: user.id,
      adminEmail: user.email,
      articleId: id,
      is_featured,
      featured_order,
      featured_until,
      timestamp: new Date().toISOString()
    });

    // Verify article exists
    const { data: article, error: articleError } = await supabaseAdmin
      .from('articles')
      .select('id, title, is_featured, featured_order, featured_until')
      .eq('id', id)
      .single();

    if (articleError) {
      console.error('Admin featured update - article fetch error:', articleError);
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

    // If setting as featured, check if featured_until is in the future
    if (is_featured && featured_until) {
      const featuredUntilDate = new Date(featured_until);
      const now = new Date();
      
      if (featuredUntilDate <= now) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FEATURED_DATE',
            message: 'Featured until date must be in the future',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    // Update article featured status
    const updateData = {
      is_featured,
      featured_order: is_featured ? (featured_order || 1) : 0,
      featured_until: is_featured ? (featured_until || null) : null,
      updated_at: new Date().toISOString()
    };

    const { data: updatedArticle, error: updateError } = await supabaseAdmin
      .from('articles')
      .update(updateData)
      .eq('id', id)
      .select(`
        id, title, is_featured, featured_order, featured_until, updated_at,
        category:categories(id, name, slug)
      `)
      .single();

    if (updateError) {
      console.error('Admin featured status update error:', updateError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update article featured status',
          details: process.env.NODE_ENV === 'development' ? updateError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log successful featured status update
    console.log(`Admin article featured status updated successfully`, {
      adminId: user.id,
      articleId: id,
      articleTitle: article.title,
      oldStatus: article.is_featured,
      newStatus: is_featured,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Article featured status updated successfully',
      data: {
        article: updatedArticle,
        updated_by: user.id,
        updated_at: updatedArticle.updated_at
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin featured status API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while updating the article featured status',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply CMS security middleware and enhanced error handler
export default withErrorHandler(withCMSSecurity(handler));
