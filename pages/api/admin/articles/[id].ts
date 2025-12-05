import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';
import { Database } from '@/lib/database-types';

type DatabaseArticleUpdate = Database['public']['Tables']['articles']['Update'];

interface ArticleUpdateData {
  title: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  status: string;
  published_at?: string | null;
}

interface StatusUpdateData {
  status: string;
  published_at?: string | null;
}

// Validation schemas
const articleUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must not exceed 255 characters'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt must not exceed 500 characters').optional(),
  featured_image: z.string().url('Invalid featured image URL').optional().nullable(),
  status: z.enum(['draft', 'published', 'archived'])
});

const statusUpdateSchema = z.object({
  status: z.enum(['draft', 'published', 'archived'])
});

// Rate limiting: 15 requests per minute per admin
const rateLimitMiddleware = withRateLimit(15, 60 * 1000, (req) => {
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

    // Check if user is admin or editor
    if (!['admin', 'editor'].includes(userProfile.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Admin or editor access required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // GET - Single article
    if (req.method === 'GET') {
      const { data: article, error } = await supabaseAdmin
        .from('articles')
        .select(`
          *,
          author:users(name)
        `)
        .eq('id', id)
        .single();

      if (error || !article) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ARTICLE_NOT_FOUND',
            message: 'Article not found',
            details: error?.message
          },
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({
        success: true,
        data: { article },
        timestamp: new Date().toISOString()
      });
    }

    // PUT - Update article
    if (req.method === 'PUT') {
      // Validate input
      articleUpdateSchema.parse(req.body);
      const { title, content, excerpt, featured_image, status } = req.body;

      // Get article to check permissions
      const { data: existingArticle, error: fetchError } = await supabaseAdmin
        .from('articles')
        .select('author_id, status')
        .eq('id', id)
        .single() as { data: { author_id: string; status: string } | null, error: { message: string } | null };

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

      // Check if user is author or admin
      if (existingArticle.author_id !== userProfile.id && userProfile.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Can only edit own articles',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Generate new slug if title changed
      const updateData: ArticleUpdateData = { title, content, excerpt, featured_image, status };
      
      if (status === 'published' && existingArticle.status !== 'published') {
        updateData.published_at = new Date().toISOString();
      } else if (status === 'draft') {
        updateData.published_at = null;
      }

      const { data: article, error } = await supabaseAdmin
        .from('articles')
        .update(updateData as DatabaseArticleUpdate)
        .eq('id', id)
        .select(`
          *,
          author:users(name)
        `)
        .single();

      if (error) {
        console.error('Error updating article:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'ARTICLE_UPDATE_FAILED',
            message: 'Failed to update article',
            details: error.message
          },
          timestamp: new Date().toISOString()
        });
      }

      // Log article update
      console.info(`Article updated by admin/editor: ${user.id}`, {
        articleId: id,
        articleTitle: title,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { article },
        timestamp: new Date().toISOString()
      });
    }

    // PATCH - Update article status (admin only)
    if (req.method === 'PATCH') {
      // Authorize admin only
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

      // Validate input
      const validatedData = statusUpdateSchema.parse(req.body);
      const { status } = validatedData;

      // Get article to check current status
      const { data: existingArticle, error: fetchError } = await supabaseAdmin
        .from('articles')
        .select('status')
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

      // Update status
      const updateData: StatusUpdateData = { status };
      
      if (status === 'published' && existingArticle.status !== 'published') {
        updateData.published_at = new Date().toISOString();
      } else if (status === 'draft') {
        updateData.published_at = null;
      }

      const { data: article, error } = await supabaseAdmin
        .from('articles')
        .update(updateData as DatabaseArticleUpdate)
        .eq('id', id)
        .select(`
          *,
          author:users(name)
        `)
        .single();

      if (error) {
        console.error('Error updating article status:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'ARTICLE_STATUS_UPDATE_FAILED',
            message: 'Failed to update article status',
            details: error.message
          },
          timestamp: new Date().toISOString()
        });
      }

      // Log status change
      console.info(`Article status changed by admin: ${user.id}`, {
        articleId: id,
        oldStatus: existingArticle.status,
        newStatus: status,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { article },
        timestamp: new Date().toISOString()
      });
    }

    // DELETE - Delete article
    if (req.method === 'DELETE') {
      // Get article to check permissions
      const { data: existingArticle, error: fetchError } = await supabaseAdmin
        .from('articles')
        .select('author_id')
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

      // Check if user is author or admin
      if (existingArticle.author_id !== userProfile.id && userProfile.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Can only delete own articles',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      const { error } = await supabaseAdmin
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting article:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'ARTICLE_DELETION_FAILED',
            message: 'Failed to delete article',
            details: error.message
          },
          timestamp: new Date().toISOString()
        });
      }

      // Log article deletion
      console.info(`Article deleted by admin/editor: ${user.id}`, {
        articleId: id,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { message: 'Article deleted successfully' },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET, PUT, PATCH, and DELETE methods are allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin article API error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing article request',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Wrap with error handler middleware
export default withErrorHandler(handler);
