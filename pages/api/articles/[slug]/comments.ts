import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { z } from 'zod';

// Validation schemas
const commentCreateSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment too long'),
  parent_id: z.string().uuid().optional().nullable(),
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

  // Get user from Supabase session (optional for GET, required for POST)
  const authHeader = req.headers.authorization;
  let userId: string | undefined;

  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = await getSupabaseAdmin() as unknown as { auth: { getUser: (token: string) => Promise<{ data: { user?: { id: string } }, error?: unknown }> } };
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (!authError && user) {
      userId = user.id;
    }
  }

  const supabaseAdmin = await getSupabaseAdmin() as unknown as {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (column: string, options?: { ascending?: boolean }) => {
          limit: (count: number) => Promise<{ data: unknown[]; error: unknown }>;
        };
        single: () => Promise<{ data: unknown; error: unknown }>;
      };
      insert: (data: unknown) => {
        select: (columns: string) => {
          single: () => Promise<{ data: unknown; error: unknown }>;
        };
      };
    };
  };
  auth: {
    getUser: (token: string) => Promise<{ data: { user?: { id: string } }; error?: unknown }>;
  };
};

  // Resolve article ID from slug/id
  const { data: article, error: articleError } = await supabaseAdmin
    .from('articles')
    .select('id, title, slug')
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

  const articleId = (article as { id: string }).id;

  switch (req.method) {
    case 'GET':
      return await handleGet(req, res, articleId);
    case 'POST':
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to comment',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }
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
  userId: string
) {
  const { content, parent_id } = req.body;
  
  // Validate input
  const validation = commentCreateSchema.safeParse({ content, parent_id });
  if (!validation.success) {
     return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid comment',
        details: validation.error
      },
      timestamp: new Date().toISOString()
    });
  }

  const supabaseAdmin = await getSupabaseAdmin() as unknown as {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (column: string, options?: { ascending?: boolean }) => {
          limit: (count: number) => Promise<{ data: unknown[]; error: unknown }>;
        };
        single: () => Promise<{ data: unknown; error: unknown }>;
      };
      insert: (data: unknown) => {
        select: (columns: string) => {
          single: () => Promise<{ data: unknown; error: unknown }>;
        };
      };
    };
  };
  auth: {
    getUser: (token: string) => Promise<{ data: { user?: { id: string } }; error?: unknown }>;
  };
};

  // If this is a reply, validate that the parent comment exists and belongs to the same article
  if (parent_id) {
    const { data: parentComment, error: parentError } = await supabaseAdmin
      .from('comments')
      .select('id, article_id')
      .eq('id', parent_id)
      .single();

    if (parentError || !parentComment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PARENT_NOT_FOUND',
          message: 'Parent comment not found',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    if ((parentComment as { article_id: string }).article_id !== articleId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARENT',
          message: 'Parent comment does not belong to this article',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  // Add new comment (insert without join)
  const { data: newComment, error: insertError } = await (supabaseAdmin as unknown as {
    from: (table: string) => {
      insert: (data: unknown) => {
        select: (columns: string) => {
          single: () => Promise<{ data: unknown; error: unknown }>;
        };
      };
    };
  }).from('comments')
    .insert({
      article_id: articleId,
      user_id: userId,
      content,
      parent_id: parent_id || null,
    })
    .select('*')
    .single();

  if (insertError || !newComment) {
    console.error('Error inserting comment:', insertError);
    throw insertError || new Error('Failed to create comment');
  }

  // Fetch the comment with author info separately
  const { data: comment, error: fetchError } = await supabaseAdmin
    .from('comments')
    .select(`
      *,
      author:users(id, name, avatar_url)
    `)
    .eq('id', (newComment as { id: string }).id)
    .single();

  if (fetchError || !comment) {
    console.error('Error fetching comment with author:', fetchError);
    // Return comment without author info if join fails
    return res.status(200).json({
      success: true,
      data: { comment: newComment },
      timestamp: new Date().toISOString()
    });
  }

  return res.status(200).json({
    success: true,
    data: { comment },
    timestamp: new Date().toISOString()
  });
}

async function handleGet(
  req: NextApiRequest, 
  res: NextApiResponse, 
  articleId: string
) {
  // Fetch all comments for the article (both top-level and replies)
  const supabaseAdmin = await getSupabaseAdmin() as unknown as {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (column: string, options?: { ascending?: boolean }) => {
          limit: (count: number) => Promise<{ data: unknown[]; error: unknown }>;
        };
        single: () => Promise<{ data: unknown; error: unknown }>;
      };
      insert: (data: unknown) => {
        select: (columns: string) => {
          single: () => Promise<{ data: unknown; error: unknown }>;
        };
      };
    };
  };
  auth: {
    getUser: (token: string) => Promise<{ data: { user?: { id: string } }; error?: unknown }>;
  };
};
  const result = await supabaseAdmin
    .from('comments')
    .select(`
      *,
      author:users(id, name, avatar_url)
    `)
    .eq('article_id', articleId)
    .order('created_at', { ascending: false });

  const { data: comments, error } = result as unknown as { data: unknown[]; error: unknown };

  if (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }

  return res.status(200).json({
    success: true,
    data: { comments },
    timestamp: new Date().toISOString()
  });
}

// Article comments API handler with simple error handling
export default withErrorHandler(handler);
