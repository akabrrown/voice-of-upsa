import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';
import { applyWatermarkToBuffer } from '@/lib/watermark';

// Validation schemas
const articleUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt too long').optional(),
  featured_image: z.string().url('Invalid image URL').nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  slug: z.string().min(1, 'Slug is required').max(255, 'Slug too long').optional()
});

// Rate limiting: 30 requests per minute per user
const rateLimitMiddleware = withRateLimit(30, 60 * 1000, (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return token || req.socket.remoteAddress || 'unknown';
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Validate article Slug/ID
  const { slug } = req.query;
  
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Valid article slug or ID is required',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  // Check if the parameter is a slug (contains hyphens, letters) or ID (uuid format)
  // UUID regex: 8-4-4-4-12 hex digits
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  const queryField = isUuid ? 'id' : 'slug';

  try {
    // Apply rate limiting
    rateLimitMiddleware(req);

    // GET - Single article with author info (by ID or slug)
    if (req.method === 'GET') {
      const { data: article, error } = await supabaseAdmin
        .from('articles')
        .select(`
          *,
          author:users(id, name, avatar_url, bio),
          category:categories(id, name, slug)
        `)
        .eq(queryField, slug)
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

      // If not published and not the author/admin, might want to restrict access
      // But for now, we'll return it (frontend handles display logic or we can add auth check here)

      return res.status(200).json({
        success: true,
        data: { article },
        timestamp: new Date().toISOString()
      });
    }

    // PUT - Update article
    if (req.method === 'PUT') {
      // Authenticate user
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

      // Get user role
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (userError) {
         return res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch user role',
            details: userError.message
          },
          timestamp: new Date().toISOString()
        });
      }

      // Fetch existing article to check ownership
      const { data: existingArticle, error: fetchError } = await supabaseAdmin
        .from('articles')
        .select('author_id, published_at')
        .eq(queryField, slug)
        .single();

      if (fetchError || !existingArticle) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Article not found',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Check permissions: Must be author or admin/editor
      const isAdminOrEditor = ['admin', 'editor'].includes(userData?.role || '');
      const isAuthor = existingArticle.author_id === authUser.id;

      if (!isAuthor && !isAdminOrEditor) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to edit this article',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Validate body
      const validation = articleUpdateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid article data',
            details: validation.error
          },
          timestamp: new Date().toISOString()
        });
      }

      const { title, content, excerpt, featured_image, status, slug: newSlug } = validation.data;

      // Process featured image with watermark if provided and status is published
      if (featured_image && status === 'published') {
        try {
          // If it's a URL, download and process it
          if (featured_image.startsWith('http')) {
            const response = await fetch(featured_image);
            const imageBuffer = Buffer.from(await response.arrayBuffer());
            await applyWatermarkToBuffer(imageBuffer, {
              text: 'VOU - Voice of UPSA',
              position: 'bottom-right',
              opacity: 0.7,
              size: 32
            });
            
            // Upload watermarked image back to storage or CDN
            // For now, we'll keep the original URL but in production you'd upload the new image
            console.log('Watermark applied to featured image on update');
          }
        } catch (error) {
          console.error('Error applying watermark:', error);
          // Continue without watermark if it fails
        }
      }

      // Update article
      const updateData: {
        title: string;
        content: string;
        excerpt: string | null;
        featured_image: string | null;
        status: string;
        updated_at: string;
        slug?: string;
        published_at?: string;
      } = {
        title,
        content,
        excerpt: excerpt ?? null,
        featured_image: featured_image ?? null,
        status,
        updated_at: new Date().toISOString(),
        published_at: existingArticle.published_at
      };

      if (newSlug) {
        updateData.slug = newSlug;
      }

      if (status === 'published' && !existingArticle.published_at) {
        updateData.published_at = new Date().toISOString();
      }

      const { data: updatedArticle, error: updateError } = await supabaseAdmin
        .from('articles')
        .update(updateData)
        .eq(queryField, slug)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'UPDATE_ERROR',
            message: 'Failed to update article',
            details: updateError.message
          },
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({
        success: true,
        data: { article: updatedArticle },
        timestamp: new Date().toISOString()
      });
    }

    // DELETE - Delete article
    if (req.method === 'DELETE') {
       // Authenticate user
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

       // Get user role
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (userError) {
         return res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch user role',
            details: userError.message
          },
          timestamp: new Date().toISOString()
        });
      }

      // Fetch existing article to check ownership
      const { data: existingArticle, error: fetchError } = await supabaseAdmin
        .from('articles')
        .select('author_id, published_at')
        .eq(queryField, slug)
        .single();

      if (fetchError || !existingArticle) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Article not found',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Check permissions: Must be author or admin
      const isAdmin = userData?.role === 'admin';
      const isAuthor = existingArticle.author_id === authUser.id;

      if (!isAuthor && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this article',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      const { error: deleteError } = await supabaseAdmin
        .from('articles')
        .delete()
        .eq(queryField, slug);

      if (deleteError) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'DELETE_ERROR',
            message: 'Failed to delete article',
            details: deleteError.message
          },
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Article deleted successfully',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : String(error)
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(handler);
