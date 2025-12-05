import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { authenticate } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/auth';

// Rate limiting: 20 bookmark actions per minute per user
const rateLimitMiddleware = withRateLimit(20, 60 * 1000, (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return token || req.socket.remoteAddress || 'unknown';
});

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST and GET methods are allowed',
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

  // Authenticate user
  const user = await authenticate(req);

  // Resolve article ID
  const { data: article, error: articleError } = await supabaseAdmin
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

  if (req.method === 'GET') {
    // Check if bookmarked
    const { data: bookmark } = await supabaseAdmin
      .from('article_bookmarks') // Use correct table name
      .select('id')
      .eq('article_id', articleId)
      .eq('user_id', user.id)
      .single();

    return res.status(200).json({
      success: true,
      data: { bookmarked: !!bookmark },
      timestamp: new Date().toISOString()
    });
  }

  // POST - Toggle bookmark
  // Check if already bookmarked
  const { data: existingBookmark } = await supabaseAdmin
    .from('article_bookmarks')
    .select('id')
    .eq('article_id', articleId)
    .eq('user_id', user.id)
    .single();

  let isBookmarked = false;

  if (existingBookmark) {
    // Remove bookmark
    const { error: deleteError } = await supabaseAdmin
      .from('article_bookmarks')
      .delete()
      .eq('article_id', articleId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error removing bookmark:', deleteError);
      throw deleteError;
    }
    isBookmarked = false;
  } else {
    // Add bookmark
    const { error: insertError } = await supabaseAdmin
      .from('article_bookmarks')
      .insert({
        article_id: articleId,
        user_id: user.id
      });

    if (insertError) {
      console.error('Error adding bookmark:', insertError);
      throw insertError;
    }
    isBookmarked = true;
  }

  res.status(200).json({ 
    success: true, 
    data: { bookmarked: isBookmarked },
    timestamp: new Date().toISOString()
  });
}

// Wrap with error handler middleware
export default withErrorHandler(handler);
