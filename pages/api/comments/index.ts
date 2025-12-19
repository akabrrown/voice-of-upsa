import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, getCMSRateLimit } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Content sanitization function
const sanitizeComment = (content: string): string => {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/data:/gi, '') // Remove data: URLs
    .replace(/[^a-zA-Z0-9\s.,!?@#%&*()_+-=]/g, '') // Allow only safe characters
    .trim()
    .substring(0, 1000); // Limit to 1000 characters
};

// Validation schemas
const commentCreateSchema = z.object({
  article_id: z.string().uuid('Invalid article ID'),
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment too long'),
  parent_id: z.string().uuid('Invalid parent comment ID').optional().nullable(),
});

const commentUpdateSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment too long'),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Apply rate limiting based on method
    const rateLimit = getCMSRateLimit(req.method || 'GET');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Handle authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization token required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get user
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: { user }, error: authError } = await (await supabaseAdmin as any).auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired authentication token',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // GET - Fetch comments for an article
    if (req.method === 'GET') {
      const { article_id } = req.query;
      
      if (!article_id || typeof article_id !== 'string') {
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

      const { data: comments, error } = await (await supabaseAdmin as any)
        .from('comments')
        .select(`
          *,
          author:users(id, name, avatar_url)
        `)
        .eq('article_id', article_id)
        .eq('status', 'approved') // Only show approved comments to public
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Comments fetch error:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'FETCH_FAILED',
            message: 'Failed to fetch comments',
            details: process.env.NODE_ENV === 'development' ? error.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          comments: comments || []
        },
        timestamp: new Date().toISOString()
      });
    }

    // POST - Create new comment
    if (req.method === 'POST') {
      const validatedData = commentCreateSchema.parse(req.body);
      const { article_id, content, parent_id } = validatedData;

      // Sanitize content
      const sanitizedContent = sanitizeComment(content);

      // Check if article exists and is published
      const { data: article, error: articleError } = await (await supabaseAdmin as any)
        .from('articles')
        .select('id, status')
        .eq('id', article_id)
        .single();

      if (articleError || !article) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ARTICLE_NOT_FOUND',
            message: 'Article not found',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Create comment with moderation status
      const { data: comment, error: commentError } = await (await supabaseAdmin as any)
        .from('comments')
        .insert({
          article_id,
          content: sanitizedContent,
          user_id: user.id,
          parent_id,
          status: 'pending', // Comments require moderation
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (commentError) {
        console.error('Comment creation error:', commentError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'CREATE_FAILED',
            message: 'Failed to create comment',
            details: process.env.NODE_ENV === 'development' ? commentError.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      console.info(`Comment created by ${user.email} for article ${article_id}`, {
        commentId: comment.id,
        status: 'pending',
        timestamp: new Date().toISOString()
      });

      return res.status(201).json({
        success: true,
        data: {
          comment,
          message: 'Comment submitted for moderation'
        },
        timestamp: new Date().toISOString()
      });
    }

    // PUT - Update comment (only own comments)
    if (req.method === 'PUT') {
      const { comment_id } = req.query;
      const validatedData = commentUpdateSchema.parse(req.body);

      if (!comment_id || typeof comment_id !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_COMMENT_ID',
            message: 'Valid comment ID is required',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Check if user owns the comment
      const { data: existingComment, error: fetchError } = await (await supabaseAdmin as any)
        .from('comments')
        .select('id, user_id')
        .eq('id', comment_id)
        .single();

      if (fetchError || !existingComment) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'COMMENT_NOT_FOUND',
            message: 'Comment not found',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      if (existingComment.user_id !== user.id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only edit your own comments',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Sanitize content
      const sanitizedContent = sanitizeComment(validatedData.content);

      // Update comment
      const { data: updatedComment, error: updateError } = await (await supabaseAdmin as any)
        .from('comments')
        .update({
          content: sanitizedContent,
          updated_at: new Date().toISOString(),
          status: 'pending' // Reset to pending after edit
        })
        .eq('id', comment_id)
        .select()
        .single();

      if (updateError) {
        console.error('Comment update error:', updateError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update comment',
            details: process.env.NODE_ENV === 'development' ? updateError.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          comment: updatedComment,
          message: 'Comment updated and submitted for moderation'
        },
        timestamp: new Date().toISOString()
      });
    }

    // DELETE - Delete comment (only own comments or admins)
    if (req.method === 'DELETE') {
      const { comment_id } = req.query;

      if (!comment_id || typeof comment_id !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_COMMENT_ID',
            message: 'Valid comment ID is required',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Check user role
      const { data: userData } = await (await supabaseAdmin as any)
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      const isAdmin = userData?.role === 'admin';

      // Check if user owns the comment or is admin
      const { data: existingComment, error: fetchError } = await (await supabaseAdmin as any)
        .from('comments')
        .select('id, user_id')
        .eq('id', comment_id)
        .single();

      if (fetchError || !existingComment) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'COMMENT_NOT_FOUND',
            message: 'Comment not found',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      if (existingComment.user_id !== user.id && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only delete your own comments',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Delete comment
      const { error: deleteError } = await (await supabaseAdmin as any)
        .from('comments')
        .delete()
        .eq('id', comment_id);

      if (deleteError) {
        console.error('Comment delete error:', deleteError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'DELETE_FAILED',
            message: 'Failed to delete comment',
            details: process.env.NODE_ENV === 'development' ? deleteError.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          message: 'Comment deleted successfully'
        },
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

  } catch (error) {
    console.error('Comments API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Comments API handler with CMS security
const handlerWithCMS = withCMSSecurity(
  handler,
  { requirePermission: 'comment:create', auditAction: 'comment_manage' }
);

export default withErrorHandler(handlerWithCMS);
