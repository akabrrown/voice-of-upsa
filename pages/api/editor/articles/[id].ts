import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, getCMSRateLimit, CMSUser } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Enhanced validation schema with security constraints
const articleUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  excerpt: z.string().max(500, 'Excerpt too long').optional(),
  featured_image: z.string().url('Invalid featured image URL').optional().nullable(),
  category_id: z.string().uuid('Invalid category ID').optional().nullable(),
  category: z.string().optional().nullable(),
  status: z.enum(['draft', 'published', 'archived', 'pending_review', 'scheduled']).optional(),
  published_at: z.string().nullable().optional(),
  contributor_name: z.string().optional()
});

// Interface for update data that includes slug and db-specific fields
interface ArticleUpdateData extends Omit<z.infer<typeof articleUpdateSchema>, 'category'> {
  category_id?: string | null;
  updated_at: string;
  slug?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse, user: CMSUser) {
  try {
    // Apply rate limiting based on method
    const rateLimit = getCMSRateLimit(req.method || 'GET');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, () => 
      getClientIP(req));
    rateLimitMiddleware(req);

    // Log editor article access
    console.log(`Editor article [${req.query.id}] accessed by user: ${user.email} (${user.id})`, {
      method: req.method,
      timestamp: new Date().toISOString(),
      securityLevel: user.securityLevel
    });

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
        // GET - Fetch single article
    if (req.method === 'GET') {
      const supabaseAdmin = await getSupabaseAdmin();
      if (!supabaseAdmin) throw new Error('Supabase admin client not available');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query = (supabaseAdmin as any)
        .from('articles')
        .select('*')
        .eq('id', id);

      // Only restrict by author if not admin
      // if (user.role !== 'admin') {
      //   query = query.eq('author_id', user.id);
      // }
        
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: article, error: fetchError } = await query.single() as any;

      if (fetchError) {
        console.error(`Article fetch failed for editor ${user.email}:`, fetchError);
        return res.status(404).json({
          success: false,
          error: {
            code: 'ARTICLE_NOT_FOUND',
            message: 'Article not found',
            details: process.env.NODE_ENV === 'development' ? fetchError.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      console.log(`Article [${id}] returned to editor ${user.email}:`, {
        title: article.title,
        status: article.status,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { article },
        timestamp: new Date().toISOString()
      });
    }

    // PUT - Update article
    if (req.method === 'PUT') {
      // Validate input
      const validatedData = articleUpdateSchema.parse(req.body);

      // Check if article exists and belongs to user
      const supabaseAdmin = await getSupabaseAdmin();
      if (!supabaseAdmin) throw new Error('Supabase admin client not available');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query = (supabaseAdmin as any)
        .from('articles')
        .select('*')
        .eq('id', id);

      // Only restrict by author if not admin
      // if (user.role !== 'admin') {
      //   query = query.eq('author_id', user.id);
      // }
        
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingArticle, error: fetchError } = await query.single() as any;

      if (fetchError || !existingArticle) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ARTICLE_NOT_FOUND',
            message: 'Article not found',
            details: process.env.NODE_ENV === 'development' && fetchError ? fetchError.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Process category update
      const categoryId = validatedData.category_id || validatedData.category;
      const validCategoryId = categoryId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId) 
        ? categoryId 
        : (categoryId === null ? null : undefined);

      // Update article
      const updateData: ArticleUpdateData = {
        ...validatedData,
        updated_at: new Date().toISOString()
      };

      // Ensure published_at is set if publishing
      if (validatedData.status === 'published' && !updateData.published_at) {
        (updateData as any).published_at = new Date().toISOString();
      }

      // Clean up updateData to match DB schema
      if (validCategoryId !== undefined) {
        updateData.category_id = validCategoryId;
      }
      delete (updateData as any).category; // Explicitly remove alias field

      // Update slug if title changed
      if (validatedData.title && validatedData.title !== existingArticle.title) {
        updateData.slug = validatedData.title.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^[-]+|[-]+$/g, '');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedArticle, error } = await (supabaseAdmin as any)
        .from('articles')
        .update(updateData)
        .eq('id', id)
        .select('*')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .single() as any;

      if (error) {
        console.error(`Article update failed for editor ${user.email}:`, error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'ARTICLE_UPDATE_FAILED',
            message: 'Failed to update article',
            details: process.env.NODE_ENV === 'development' ? error.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Log article update
      console.info(`Article updated by editor: ${user.email}`, {
        articleId: id,
        title: updatedArticle.title,
        changes: validatedData,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { article: updatedArticle },
        timestamp: new Date().toISOString()
      });
    }
          // DELETE - Delete article
    if (req.method === 'DELETE') {
      // Check if article exists and belongs to user
      const supabaseAdmin = await getSupabaseAdmin();
      if (!supabaseAdmin) throw new Error('Supabase admin client not available');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query = (supabaseAdmin as any)
        .from('articles')
        .select('id, title')
        .eq('id', id);

      // Only restrict by author if not admin
      // if (user.role !== 'admin') {
      //   query = query.eq('author_id', user.id);
      // }
        
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingArticle, error: fetchError } = await query.single() as any;

      if (fetchError || !existingArticle) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ARTICLE_NOT_FOUND',
            message: 'Article not found',
            details: process.env.NODE_ENV === 'development' && fetchError ? fetchError.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Delete the article
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const deleteQuery = (supabaseAdmin as any)
        .from('articles')
        .delete()
        .eq('id', id);

      // Only restrict by author if not admin
      // if (user.role !== 'admin') {
      //   deleteQuery = deleteQuery.eq('author_id', user.id);
      // }

      const { error: deleteError } = await deleteQuery;

      if (deleteError) {
        console.error(`Article deletion failed for editor ${user.email}:`, deleteError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'ARTICLE_DELETION_FAILED',
            message: 'Failed to delete article',
            details: process.env.NODE_ENV === 'development' ? deleteError.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Log article deletion
      console.info(`Article deleted by editor: ${user.email}`, {
        articleId: id,
        title: existingArticle.title,
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
        message: 'Only GET, PUT, and DELETE methods are allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Editor article API error for user ${user.email}:`, error);
    return res.status(500).json({
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

// Apply enhanced CMS security middleware and error handler
export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'edit:articles',
  auditAction: 'editor_article_accessed'
}));

                      
          
