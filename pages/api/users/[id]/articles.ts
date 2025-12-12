import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { verifySupabaseToken } from '@/lib/auth';

// Apply error handling middleware
export default withErrorHandler(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const userId = await verifySupabaseToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { id } = req.query;
    const { page = 1, status = 'all' } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if user can access these articles (own articles or admin)
    if (userId !== id) {
      // Check if requesting user is admin
      const { data: requestingUser } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const currentPage = parseInt(page as string);
    const limit = 12;
    const offset = (currentPage - 1) * limit;

    // Build query
    let query = supabaseAdmin
      .from('articles')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image,
        status,
        views_count,
        created_at,
        updated_at,
        published_at
      `, { count: 'exact' })
      .eq('author_id', id)
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: articles, error, count } = await query;

    if (error) {
      console.error('Error fetching user articles:', error);
      return res.status(500).json({ error: 'Failed to fetch articles' });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    res.status(200).json({
      articles: articles || [],
      pagination: {
        currentPage,
        totalPages,
        totalItems: count || 0,
        itemsPerPage: limit,
      },
      totalPages, // Keep for backward compatibility
    });
  } catch (error) {
    console.error('User articles API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
