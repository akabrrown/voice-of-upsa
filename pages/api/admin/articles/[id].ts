import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, getCMSRateLimit, CMSUser } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { requireAdminOrEditor } from '@/lib/auth-helpers';
import { z } from 'zod';

// Simple HTML sanitization function
const sanitizeHTML = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<video\b[^<]*(?:(?!<\/video>)<[^<]*)*<\/video>/gi, '')
    .replace(/<audio\b[^<]*(?:(?!<\/audio>)<[^<]*)*<\/audio>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/data:/gi, ''); // Remove data: URLs
};

// Validation schemas for article updates
const updateFeaturedSchema = z.object({
  is_featured: z.boolean(),
  featured_order: z.number().min(0, 'Featured order must be non-negative').max(9999, 'Featured order must be less than 10000').optional(),
  featured_until: z.string().datetime('Invalid datetime format').optional()
});

const updateCategorySchema = z.object({
  category_id: z.string().uuid('Invalid category ID format')
});

const updateDisplayLocationSchema = z.object({
  display_location: z.enum(['homepage', 'category', 'sidebar', 'hidden'])
});

const updateScheduleSchema = z.object({
  publish_at: z.string().datetime('Invalid datetime format').optional(),
  unpublish_at: z.string().datetime('Invalid datetime format').optional()
});

const updateSettingsSchema = z.object({
  allow_comments: z.boolean(),
  show_author: z.boolean(),
  show_date: z.boolean(),
  meta_title: z.string().max(100, 'Meta title too long').optional(),
  meta_description: z.string().max(200, 'Meta description too long').optional(),
  meta_keywords: z.string().max(200, 'Meta keywords too long').optional()
});

async function handler(req: NextApiRequest, res: NextApiResponse, user: CMSUser) {
  try {
    // Server-side role check - double security
    await requireAdminOrEditor(req);

    // Apply rate limiting based on method
    const rateLimit = getCMSRateLimit(req.method || 'GET');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Log article access
    console.log(`Admin article [${req.query.id}] accessed by user: ${user.email} (${user.id})`, {
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
      const { data, error } = await supabaseAdmin
        .from('articles')
        .select(`
          *,
          author:users(name, email),
          category:categories(id, name, slug)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Article fetch failed for admin ${user.email}:`, error);
        return res.status(404).json({
          success: false,
          error: {
            code: 'ARTICLE_NOT_FOUND',
            message: 'Article not found',
            details: process.env.NODE_ENV === 'development' ? error.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Sanitize article data
      const sanitizedArticle = {
        id: data.id,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        featured_image: data.featured_image,
        status: data.status,
        views_count: data.views_count,
        created_at: data.created_at,
        updated_at: data.updated_at,
        published_at: data.published_at,
        author: data.author,
        category: data.category
      };

      console.log(`Article [${id}] returned to admin: ${user.email}`, {
        title: data.title,
        status: data.status,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { article: sanitizedArticle },
        timestamp: new Date().toISOString()
      });
    }

    // PUT - Update article properties
    if (req.method === 'PUT') {
      const { updateType } = req.body;
      
      if (!updateType) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_UPDATE_TYPE',
            message: 'Update type is required',
            details: 'Valid types: featured, category, display_location, schedule, settings'
          },
          timestamp: new Date().toISOString()
        });
      }

      let updateData: any = {};
      let validatedData: any;

      switch (updateType) {
        case 'featured':
          validatedData = updateFeaturedSchema.safeParse(req.body);
          if (!validatedData.success) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'INVALID_INPUT',
                message: 'Invalid featured update data',
                details: validatedData.error.errors
              },
              timestamp: new Date().toISOString()
            });
          }
          updateData = {
            is_featured: validatedData.data.is_featured,
            featured_order: validatedData.data.featured_order,
            featured_until: validatedData.data.featured_until
          };
          break;

        case 'category':
          validatedData = updateCategorySchema.safeParse(req.body);
          if (!validatedData.success) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'INVALID_INPUT',
                message: 'Invalid category update data',
                details: validatedData.error.errors
              },
              timestamp: new Date().toISOString()
            });
          }
          updateData = { category_id: validatedData.data.category_id };
          break;

        case 'display_location':
          validatedData = updateDisplayLocationSchema.safeParse(req.body);
          if (!validatedData.success) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'INVALID_INPUT',
                message: 'Invalid display location update data',
                details: validatedData.error.errors
              },
              timestamp: new Date().toISOString()
            });
          }
          updateData = { display_location: validatedData.data.display_location };
          break;

        case 'schedule':
          validatedData = updateScheduleSchema.safeParse(req.body);
          if (!validatedData.success) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'INVALID_INPUT',
                message: 'Invalid schedule update data',
                details: validatedData.error.errors
              },
              timestamp: new Date().toISOString()
            });
          }
          updateData = {
            publish_at: validatedData.data.publish_at,
            unpublish_at: validatedData.data.unpublish_at
          };
          break;

        case 'settings':
          validatedData = updateSettingsSchema.safeParse(req.body);
          if (!validatedData.success) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'INVALID_INPUT',
                message: 'Invalid settings update data',
                details: validatedData.error.errors
              },
              timestamp: new Date().toISOString()
            });
          }
          updateData = {
            allow_comments: validatedData.data.allow_comments,
            show_author: validatedData.data.show_author,
            show_date: validatedData.data.show_date,
            meta_title: validatedData.data.meta_title,
            meta_description: validatedData.data.meta_description,
            meta_keywords: validatedData.data.meta_keywords
          };
          break;

        default:
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_UPDATE_TYPE',
              message: 'Invalid update type',
              details: 'Valid types: featured, category, display_location, schedule, settings'
            },
            timestamp: new Date().toISOString()
          });
      }

      const { data: updatedArticle, error } = await supabaseAdmin
        .from('articles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Article update failed for admin ${user.email}:`, error);
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

      return res.status(200).json({
        success: true,
        data: { article: updatedArticle },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET and PUT methods are allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Article API error for admin ${user.email}:`, error);
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
  requirePermission: 'manage:content',
  auditAction: 'article_accessed'
}));

                                      
