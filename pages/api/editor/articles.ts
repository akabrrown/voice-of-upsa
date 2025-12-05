import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token provided'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Check if user is an editor
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || (userData.role !== 'editor' && userData.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Editor role required.'
      });
    }

    if (req.method === 'GET') {
      // Get query parameters
      const { search = '', status = 'all', page = '1', limit = '10' } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Build query
      let query = supabaseAdmin
        .from('articles')
        .select('*')
        .eq('author_id', user.id);

      // Add search filter
      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }

      // Add status filter
      if (status !== 'all') {
        query = query.eq('status', status);
      }

      // Add ordering and pagination
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);

      const { data: articles, error: fetchError } = await query;

      if (fetchError) {
        console.error('Articles fetch error:', fetchError);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch articles'
        });
      }

      // Get total count for pagination
      let countQuery = supabaseAdmin
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id);

      if (search) {
        countQuery = countQuery.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }

      if (status !== 'all') {
        countQuery = countQuery.eq('status', status);
      }

      const { count: totalCount } = await countQuery;

      return res.status(200).json({
        success: true,
        articles: articles || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limitNum)
        }
      });

    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('Editor articles API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

