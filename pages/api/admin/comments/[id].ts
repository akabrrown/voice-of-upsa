import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, getCMSRateLimit, CMSUser } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Enhanced validation schema with security constraints
const commentUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'spam']),
  admin_notes: z.string().max(500, 'Admin notes too long').optional()
});

async function handler(req: NextApiRequest, res: NextApiResponse, user: CMSUser) {
  try {
    // Apply rate limiting based on method
    const rateLimit = getCMSRateLimit(req.method || 'GET');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Log comment access
    console.log(`Admin comment [${req.query.id}] accessed by user: ${user.email} (${user.id})`, {
      method: req.method,
      timestamp: new Date().toISOString(),
      securityLevel: user.securityLevel
    });

    // Validate comment ID
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
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

    // GET - Fetch single comment
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('comments')
        .select(`
          *,
          user:users(name, email),
          article:articles(title, slug)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Comment fetch failed for admin ${user.email}:`, error);
        return res.status(404).json({
          success: false,
          error: {
            code: 'COMMENT_NOT_FOUND',
            message: 'Comment not found',
            details: process.env.NODE_ENV === 'development' ? error.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Sanitize comment data
      const sanitizedComment = {
        id: data.id,
        content: data.content,
        name: data.name,
        email: data.email,
        status: data.status,
        admin_notes: data.admin_notes,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user: data.user ? {
          name: data.user.name,
          email: data.user.email
        } : null,
        article: data.article ? {
          title: data.article.title,
          slug: data.article.slug
        } : null,
        // Remove sensitive fields
        ip_address: undefined,
        user_agent: undefined
      };

      console.log(`Comment [${id}] returned to admin: ${user.email}`, {
        status: data.status,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { comment: sanitizedComment },
        timestamp: new Date().toISOString()
      });
    }

    // PATCH - Update comment status
    if (req.method === 'PATCH') {
      // Validate input
      const validatedData = commentUpdateSchema.parse(req.body);

      // Get comment to ensure it exists
      const { data: existingComment, error: fetchError } = await supabaseAdmin
        .from('comments')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingComment) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'COMMENT_NOT_FOUND',
            message: 'Comment not found',
            details: process.env.NODE_ENV === 'development' ? fetchError?.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Update comment
      const { data: updatedComment, error } = await supabaseAdmin
        .from('comments')
        .update(validatedData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error(`Comment update failed for admin ${user.email}:`, error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'COMMENT_UPDATE_FAILED',
            message: 'Failed to update comment',
            details: process.env.NODE_ENV === 'development' ? error.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Sanitize updated comment
      const sanitizedComment = {
        id: updatedComment.id,
        content: updatedComment.content,
        name: updatedComment.name,
        email: updatedComment.email,
        status: updatedComment.status,
        admin_notes: updatedComment.admin_notes,
        created_at: updatedComment.created_at,
        updated_at: updatedComment.updated_at,
        // Remove sensitive fields
        ip_address: undefined,
        user_agent: undefined
      };

      // Log comment update
      console.info(`Comment updated by admin: ${user.email}`, {
        commentId: id,
        changes: validatedData,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { comment: sanitizedComment },
        timestamp: new Date().toISOString()
      });
    }

    // DELETE - Delete comment
    if (req.method === 'DELETE') {
      // Get comment to ensure it exists
      const { data: existingComment, error: fetchError } = await supabaseAdmin
        .from('comments')
        .select('id')
        .eq('id', id)
        .single();

      if (fetchError || !existingComment) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'COMMENT_NOT_FOUND',
            message: 'Comment not found',
            details: process.env.NODE_ENV === 'development' ? fetchError.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Delete the comment
      const { error: deleteError } = await supabaseAdmin
        .from('comments')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error(`Comment deletion failed for admin ${user.email}:`, deleteError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'COMMENT_DELETION_FAILED',
            message: 'Failed to delete comment',
            details: process.env.NODE_ENV === 'development' ? deleteError.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Log comment deletion
      console.info(`Comment deleted by admin: ${user.email}`, {
        commentId: id,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { message: 'Comment deleted successfully' },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET, PATCH, and DELETE methods are allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Comment API error for admin ${user.email}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing comment request',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply enhanced CMS security middleware and error handler
export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'manage:comments',
  auditAction: 'comment_accessed'
}));
