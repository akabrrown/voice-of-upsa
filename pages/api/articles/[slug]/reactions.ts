import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { z } from 'zod';

// Validation schemas
const reactionCreateSchema = z.object({
  reaction_type: z.enum(['thumbsup', 'heart', 'smile', 'star', 'meh']),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Article slug is required',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  // Check if the parameter is a slug (contains hyphens, letters) or ID (uuid format)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  const queryField = isUuid ? 'id' : 'slug';

  // Get user from Supabase session
  const authHeader = req.headers.authorization;
  let userId: string | undefined;

  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (!authError && user) {
      userId = user.id;
    }
  }

  // For POST, allow both authenticated and anonymous users
  // userId will be undefined for anonymous users

  // Resolve article ID from slug/id
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

  switch (req.method) {
    case 'GET':
      return await handleGet(req, res, articleId, userId);
    case 'POST':
      return await handlePost(req, res, articleId, userId);
    default:
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Method not allowed',
          details: null
        },
        timestamp: new Date().toISOString()
      });
  }
}

async function handlePost(
  req: NextApiRequest, 
  res: NextApiResponse, 
  articleId: string, 
  userId?: string
) {
  const { reaction_type } = req.body;
  
  // Validate input
  const validation = reactionCreateSchema.safeParse({ reaction_type });
  if (!validation.success) {
     return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid reaction type',
        details: validation.error
      },
      timestamp: new Date().toISOString()
    });
  }

  // Remove any existing reaction from this client for this article
  if (userId) {
    // For authenticated users, remove by user_id
    await supabaseAdmin
      .from('reactions')
      .delete()
      .eq('article_id', articleId)
      .eq('user_id', userId);
  } else {
    // For anonymous users, we don't track individual reactions by IP
    // Just allow them to add reactions (multiple anonymous users can react)
  }

  // Add new reaction
  const { error: reactionError } = await supabaseAdmin
    .from('reactions')
    .insert({
      article_id: articleId,
      user_id: userId || null, // Use null for anonymous users
      reaction_type,
    });

  if (reactionError) {
    throw reactionError;
  }

  // Get updated reaction counts
  const updatedReactions = await getReactionCounts(articleId, userId);

  return res.status(200).json({
    success: true,
    data: { reactions: updatedReactions },
    timestamp: new Date().toISOString()
  });
}

async function handleGet(
  req: NextApiRequest, 
  res: NextApiResponse, 
  articleId: string, 
  userId?: string
) {
  const reactions = await getReactionCounts(articleId, userId);
  return res.status(200).json({
    success: true,
    data: { reactions },
    timestamp: new Date().toISOString()
  });
}

async function getReactionCounts(articleId: string, userId?: string) {
  const { data: reactions, error } = await supabaseAdmin
    .from('reactions')
    .select('reaction_type, user_id')
    .eq('article_id', articleId);

  if (error) {
    console.error('Error fetching reactions:', error);
    return [];
  }

  const reactionTypes = ['thumbsup', 'heart', 'smile', 'star', 'meh'] as const;
  const result = reactionTypes.map(type => {
    const typeReactions = reactions?.filter((r: { reaction_type: string; user_id: string }) => r.reaction_type === type) || [];
    return {
      type,
      count: typeReactions.length,
      userReacted: userId ? typeReactions.some((r: { reaction_type: string; user_id: string }) => r.user_id === userId) : false,
    };
  });

  return result;
}

export default withErrorHandler(handler);
