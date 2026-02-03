import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, CMSUser } from '@/lib/security/cms-security';

// Type definition for database operations where Supabase types are not available
type DatabaseOperations = {
  delete: () => { eq: (column: string, value: string) => Promise<{ data: unknown; error: unknown }> };
  select: (columns?: string) => { eq: (column: string, value: string) => { single: () => Promise<{ data: unknown; error: unknown }> } };
};

async function handler(req: NextApiRequest, res: NextApiResponse, requesterUser: CMSUser) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only DELETE method is allowed'
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    const supabaseAdmin = await getSupabaseAdmin();
    if (!supabaseAdmin) {
      throw new Error('Database connection failed');
    }

    // Get article ID from URL parameters
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ARTICLE_ID',
          message: 'Valid article ID is required'
        },
        timestamp: new Date().toISOString()
      });
    }

    try {
      // First check if article exists
      const { data: existingArticle, error: fetchError } = await (supabaseAdmin
        .from('articles') as unknown as DatabaseOperations)
        .select('id')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching article for deletion:', fetchError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'ARTICLE_FETCH_ERROR',
            message: 'Failed to fetch article for deletion',
            details: process.env.NODE_ENV === 'development' ? (fetchError as Error)?.message || String(fetchError) : null
          },
          timestamp: new Date().toISOString()
        });
      }

      if (!existingArticle) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ARTICLE_NOT_FOUND',
            message: 'Article not found'
          },
          timestamp: new Date().toISOString()
        });
      }

      // Delete the article
      const { error: deleteError } = await (supabaseAdmin
        .from('articles') as unknown as DatabaseOperations)
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error(`Article deletion failed for admin ${requesterUser.email}:`, deleteError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'ARTICLE_DELETION_FAILED',
            message: 'Failed to delete article',
            details: process.env.NODE_ENV === 'development' ? (deleteError as Error)?.message || String(deleteError) : null
          },
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          message: 'Article deleted successfully',
          articleId: id
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Unexpected error during article deletion:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while deleting the article',
          details: process.env.NODE_ENV === 'development' ? (error as Error)?.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Admin articles API error:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing article deletion',
        details: process.env.NODE_ENV === 'development' ? (error as Error)?.message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'delete:articles',
  auditAction: 'article_deleted'
}));
