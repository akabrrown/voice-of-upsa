import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';
import { z } from 'zod';
import { Database } from '@/lib/database-types';

type DatabaseArticleUpdate = Database['public']['Tables']['articles']['Update'];

// Enhanced validation schema for category update
const categoryUpdateSchema = z.object({
  category_id: z.string().uuid('Invalid category ID format').nullable().optional()
});

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string; securityLevel?: string }) {
  try {
    // Only allow PUT for category updates
    if (req.method !== 'PUT') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only PUT method is allowed for category updates',
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
    const validatedData = categoryUpdateSchema.parse(req.body);
    const { category_id } = validatedData;

    // Log admin category update action
    console.log(`Admin article category update initiated`, {
      adminId: user.id,
      adminEmail: user.email,
      articleId: id,
      newCategoryId: category_id,
      timestamp: new Date().toISOString()
    });

    // Verify article exists
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: article, error: articleError } = await (await supabaseAdmin as any)
      .from('articles')
      .select('id, title, category_id')
      .eq('id', id)
      .single();

    if (articleError) {
      console.error('Admin category update - article fetch error:', articleError);
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

    // If category_id is provided, verify category exists
    if (category_id) {
      const { error: categoryError } = await (await supabaseAdmin as any)
        .from('categories')
        .select('id')
        .eq('id', category_id)
        .single();

      if (categoryError) {
        console.error('Admin category update - category fetch error:', categoryError);
        return res.status(400).json({
          success: false,
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: 'Category not found',
            details: process.env.NODE_ENV === 'development' ? categoryError.message : null
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    // Update article category
    const updateData: DatabaseArticleUpdate = {
      category_id: category_id
    };

    const { data: updatedArticle, error: updateError } = await (await supabaseAdmin as any)
      .from('articles')
      .update(updateData)
      .eq('id', id)
      .select('id, title, category_id, updated_at')
      .single();

    if (updateError) {
      console.error('Admin category update error:', updateError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update article category',
          details: process.env.NODE_ENV === 'development' ? updateError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log successful category update
    console.log(`Admin article category updated successfully`, {
      adminId: user.id,
      articleId: id,
      articleTitle: article.title,
      oldCategoryId: article.category_id,
      newCategoryId: category_id,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Article category updated successfully',
      data: {
        article: updatedArticle,
        updated_by: user.id,
        updated_at: updatedArticle.updated_at
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin article category API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while updating the article category',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply CMS security middleware and enhanced error handler
export default withErrorHandler(withCMSSecurity(handler));
