import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';

    const offset = (page - 1) * limit;

    // Build the query
    let query = supabaseAdmin
      .from('users')
      .select(`
        *,
        archiver:users!archived_by(name, email)
      `, { count: 'exact' })
      .eq('status', 'archived')
      .order('archived_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add search filter if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: archivedUsers, error, count } = await query;

    if (error) {
      console.error('Error fetching archived users:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch archived users',
        details: error.message
      });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return res.status(200).json({
      success: true,
      data: {
        users: archivedUsers || [],
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers: count || 0,
          limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Archived users API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

