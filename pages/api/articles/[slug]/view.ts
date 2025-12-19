import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { authenticate } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/auth';

// Rate limiting: 60 view tracking per minute per user (prevent abuse)
const rateLimitMiddleware = withRateLimit(60, 60 * 1000, (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return token || req.socket.remoteAddress || 'unknown';
});

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('🔍 View tracking API called:', { method: req.method, slug: req.query.slug });
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  // Apply rate limiting
  rateLimitMiddleware(req);

  // Validate article slug
  const { slug } = req.query;
  
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Valid article slug is required',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  // Check if the parameter is a slug (contains hyphens, letters) or ID (uuid format)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  const queryField = isUuid ? 'id' : 'slug';

  // Get client info
  const ipAddress = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   (req.connection && req.connection.remoteAddress) || 
                   'unknown';
  
  const userAgent = req.headers['user-agent'] || 'unknown';

  console.log('🔍 Client info:', { ipAddress, userAgent: userAgent.substring(0, 50) + '...' });

  // Try to authenticate user (optional for view tracking)
  let user = null;
  try {
    user = await authenticate(req);
    console.log('🔍 User authenticated:', !!user);
  } catch {
    console.log('🔍 View tracking for anonymous user');
    // View tracking works for anonymous users too
  }

  const supabaseAdmin = await getSupabaseAdmin();

  // Resolve article ID
  const { data: article, error: articleError } = await (await supabaseAdmin as any)
    .from('articles')
    .select('id')
    .eq(queryField, slug)
    .single();

  if (articleError || !article) {
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

  const articleId = article.id;

  // Get current view count
  const { data: currentArticle, error: fetchError } = await (await supabaseAdmin as any)
    .from('articles')
    .select('views_count')
    .eq('id', articleId)
    .single();

  if (fetchError) {
    console.error('Error fetching current view count:', fetchError);
  }

  // Track view using article_views table
  const { error: viewError } = await (await supabaseAdmin as any)
    .from('article_views')
    .insert({
      article_id: articleId,
      user_id: user?.id || null,
      ip_address: typeof ipAddress === 'string' ? ipAddress : ipAddress[0],
      user_agent: userAgent
    });

  if (viewError) {
    if (viewError.code === '23505') {
      // Unique violation - already viewed by this user/IP
      console.log('Article already viewed by this user/IP');
    } else {
      console.error('Error tracking view:', viewError);
    }
  } else {
    // New view recorded, increment the count
    const { error: updateError } = await (await supabaseAdmin as any)
      .from('articles')
      .update({ 
        views_count: (currentArticle?.views_count || 0) + 1 
      })
      .eq('id', articleId);

    if (updateError) {
      console.error('Error updating view count:', updateError);
    } else {
      console.log('Successfully incremented view count for article:', articleId);
    }
  }

  // Get updated view count for response
  const { data: updatedArticle, error: updatedFetchError } = await (await supabaseAdmin as any)
    .from('articles')
    .select('views_count')
    .eq('id', articleId)
    .single();

  if (updatedFetchError) {
    console.error('Error fetching updated view count:', updatedFetchError);
  }

  res.status(200).json({ 
    success: true,
    data: { 
      message: 'View tracked successfully',
      views_count: updatedArticle?.views_count || 0
    },
    timestamp: new Date().toISOString()
  });
}

// Wrap with error handler middleware
export default withErrorHandler(handler);
