import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';
import { Database } from '@/lib/database-types';

type DatabaseArticleUpdate = Database['public']['Tables']['articles']['Update'];

// Validation schema
const categoryUpdateSchema = z.object({
  category_id: z.string().nullable().optional()
});

// Rate limiting: 20 requests per minute per admin
const rateLimitMiddleware = withRateLimit(20, 60 * 1000, (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return token || req.socket.remoteAddress || 'unknown';
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Apply rate limiting
    rateLimitMiddleware(req);

    // Authenticate user using admin client directly
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authorization token provided',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token and get user
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !authUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Create user object for compatibility
    const user = {
      id: authUser.id,
      email: authUser.email
    };

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

    // Get user profile from database to check role
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, id')
      .eq('id', user.id)
      .single() as { data: { role: string; id: string } | null, error: { message: string } | null };

    if (userError || !userProfile) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found',
          details: userError?.message
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if user is admin
    if (userProfile.role !== 'admin') {
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

    // PUT - Update article category
    if (req.method === 'PUT') {
      // Validate input
      const validatedData = categoryUpdateSchema.parse(req.body);
      const { category_id } = validatedData;

      // Check if article exists
      const { data: existingArticle, error: fetchError } = await supabaseAdmin
        .from('articles')
        .select('id, title, category_id')
        .eq('id', id)
        .single();

      if (fetchError || !existingArticle) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ARTICLE_NOT_FOUND',
            message: 'Article not found',
            details: fetchError?.message
          },
          timestamp: new Date().toISOString()
        });
      }

      // If category_id is provided, verify it exists
      if (category_id) {
        const { data: category, error: categoryError } = await supabaseAdmin
          .from('categories')
          .select('id, name')
          .eq('id', category_id)
          .single();

        if (categoryError || !category) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_CATEGORY',
              message: 'Category not found',
              details: 'The specified category does not exist'
            },
            timestamp: new Date().toISOString()
          });
        }
      }

      // Update article category
      const { data: article, error } = await supabaseAdmin
        .from('articles')
        .update({ category_id } as DatabaseArticleUpdate)
        .eq('id', id)
        .select(`
          *,
          author:users(name),
          category:categories(name, slug)
        `)
        .single();

      if (error) {
        console.error('Error updating article category:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'ARTICLE_CATEGORY_UPDATE_FAILED',
            message: 'Failed to update article category',
            details: error.message
          },
          timestamp: new Date().toISOString()
        });
      }

      // Log category change
      console.info(`Article category changed by admin: ${user.id}`, {
        articleId: id,
        articleTitle: existingArticle.title,
        oldCategoryId: existingArticle.category_id,
        newCategoryId: category_id,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { article },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only PUT method is allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin article category API error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing category request',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Wrap with error handler middleware
export default withErrorHandler(handler);
