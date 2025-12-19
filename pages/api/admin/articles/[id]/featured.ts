import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { getCMSRateLimit } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { requireAdminOrEditor } from '@/lib/auth-helpers';

interface ArticleUpdate {
  is_featured: boolean;
  featured_order: number;
  updated_at: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only PUT method is allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Apply rate limiting
    const rateLimitConfig = getCMSRateLimit('PUT');
    const rateLimitMiddleware = withRateLimit(rateLimitConfig.requests, rateLimitConfig.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Apply authentication middleware
    const user = await requireAdminOrEditor(req);
    console.log(`Featured API: Admin access granted for ${user.email}`);

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

    const { is_featured, featured_order } = req.body;

    // Get Supabase admin client
    const supabaseAdmin = await getSupabaseAdmin();

    // Update article featured status
    const updateData: ArticleUpdate = {
      is_featured: is_featured,
      featured_order: featured_order || 0,
      updated_at: new Date().toISOString()
    };
    
  
    const { error } = await supabaseAdmin
      .from('articles')
      .update(updateData as never)
      .eq('id', id);
      
    if (error) {
      console.error('Error updating featured status:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update article featured status',
          details: process.env.NODE_ENV === 'development' ? error.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Fetch the updated article
    const { data: updatedArticle, error: fetchError } = await supabaseAdmin
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();
      
    if (fetchError) {
      console.error('Error fetching updated article:', fetchError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch updated article',
          details: process.env.NODE_ENV === 'development' ? fetchError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    console.info(`Article featured status updated by ${user.email}:`, {
      articleId: id,
      is_featured,
      featured_order,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      data: updatedArticle,
      message: `Article ${is_featured ? 'featured' : 'unfeatured'} successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Featured update error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while updating featured status',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply enhanced CMS security middleware and error handler
export default withErrorHandler(handler);