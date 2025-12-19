import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';

// Type definition for database operations where Supabase types are not available
type DatabaseOperations = {
  delete: () => { eq: (column: string, value: string) => Promise<{ data: unknown; error: unknown }> };
  select: (columns?: string) => { eq: (column: string, value: string) => { single: () => Promise<{ data: unknown; error: unknown }> } };
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Admin Article API [id] reached:', {
    method: req.method,
    url: req.url,
    query: req.query,
    timestamp: new Date().toISOString()
  });
  try {
    // Internal authentication check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.substring(7);
    const supabaseAdmin = await getSupabaseAdmin();
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid authentication token'
        },
        timestamp: new Date().toISOString()
      });
    }

    // CRITICAL SECURITY: Fetch role from authoritative source (users table), not metadata
    // user_metadata can be manipulated by client; users table is authoritative
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('Failed to fetch user role from database:', userError);
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Unable to verify user permissions'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Type assertion for userData
    const userRole = (userData as { role: string }).role;

    // Check if user has appropriate role (admin only for deletion)
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required to delete articles'
        },
        timestamp: new Date().toISOString()
      });
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

    // Apply rate limiting
    const rateLimitMiddleware = withRateLimit(50, 60 * 1000, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    if (req.method === 'DELETE') {
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
          console.error(`Article deletion failed for admin ${user.email}:`, deleteError);
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

        // Log article deletion
        console.info(`Article deleted by admin: ${user.email}`, {
          articleId: id,
          timestamp: new Date().toISOString()
        });

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
    } else {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only DELETE method is allowed'
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

// Apply error handler only
export default withErrorHandler(handler);