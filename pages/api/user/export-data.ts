import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, getCMSRateLimit } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string; securityLevel?: string }) {
  try {
    // Apply rate limiting for data export
    const rateLimit = getCMSRateLimit('GET');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Only allow GET
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only GET method is allowed',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }
            // Fetch// Get user's data
    const supabaseAdmin = await getSupabaseAdmin();
    const [profile, articles, comments] = await Promise.all([
      // User profile
      (await supabaseAdmin as any)
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single(),
      
      // User's articles
      (await supabaseAdmin as any)
        .from('articles')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false }),
      
      // User's comments
      (await supabaseAdmin as any)
        .from('comments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    ]);

    // Handle any errors
    if (profile.error) {
      console.error(`Profile fetch failed for user ${user.email}:`, profile.error);
    }

    if (articles.error) {
      console.error(`Articles fetch failed for user ${user.email}:`, articles.error);
    }

    if (comments.error) {
      console.error(`Comments fetch failed for user ${user.email}:`, comments.error);
    }

    // Sanitize and compile user data
    const userData = {
      export_date: new Date().toISOString(),
      user: {
        id: profile.data?.id,
        email: profile.data?.email,
        name: profile.data?.name,
        role: profile.data?.role,
        bio: profile.data?.bio,
        avatar_url: profile.data?.avatar_url,
        website: profile.data?.website,
        location: profile.data?.location,
        social_links: profile.data?.social_links,
        preferences: profile.data?.preferences,
        created_at: profile.data?.created_at,
        updated_at: profile.data?.updated_at,
        // Remove sensitive fields
        is_active: undefined,
        last_login_at: undefined,
        email_verified: undefined,
        last_sign_in_at: undefined
      },
      articles: articles.data?.map((article: any) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        featured_image: article.featured_image,
        status: article.status,
        published_at: article.published_at,
        created_at: article.created_at,
        updated_at: article.updated_at,
        view_count: article.view_count,
        likes_count: article.likes_count,
        comments_count: article.comments_count
      })) || [],
      comments: comments.data?.map((comment: any) => ({
        id: comment.id,
        article_id: comment.article_id,
        content: comment.content,
        status: comment.status,
        created_at: comment.created_at,
        updated_at: comment.updated_at
      })) || []
    };

    // Set appropriate headers for JSON download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-${user.id}-${Date.now()}.json"`);

    return res.status(200).json({
      success: true,
      data: userData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Data export API error for user ${user.email}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while exporting data',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply enhanced CMS security middleware and error handler
export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'export:data',
  auditAction: 'user_data_exported'
}));
            
