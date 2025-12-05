import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { authenticate } from '@/lib/api/middleware/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  // Authenticate user
  const user = await authenticate(req);

  const { status } = req.query;

  // Build query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabaseAdmin as any)
    .from('articles')
    .select('*')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false });

  // Filter by status if provided
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: articles, error } = await query;

  if (error) {
    console.error('Error fetching user articles:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch articles',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }

  return res.status(200).json({
    success: true,
    articles: articles || [],
    timestamp: new Date().toISOString()
  });
}

export default withErrorHandler(handler);

