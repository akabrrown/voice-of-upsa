import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { getCMSRateLimit } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Apply public-friendly rate limiting
    const rateLimit = getCMSRateLimit(req.method || 'GET');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Log public categories access
    console.log(`Public categories API accessed`, {
      method: req.method,
      ip: getClientIP(req),
      timestamp: new Date().toISOString()
    });

    // GET - List categories (public access)
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('id, name, slug, description, color')
        .order('name', { ascending: true });

      if (error) {
        console.error('Public categories query error:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'QUERY_ERROR',
            message: 'Failed to fetch categories',
            details: process.env.NODE_ENV === 'development' ? error.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Filter out Anonymous category from public view
      const filteredCategories = (data || []).filter(
        category => category.slug !== 'anonymous' && category.name !== 'Anonymous'
      );

      // Log successful fetch
      console.log(`Public categories fetched successfully`, {
        categoriesCount: filteredCategories.length,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: {
          categories: filteredCategories
        },
        timestamp: new Date().toISOString()
      });
    }

    // Only allow GET for public access
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET method is allowed for public access',
        details: null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Public categories API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while fetching categories',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply enhanced error handler
export default withErrorHandler(handler);
                
    
