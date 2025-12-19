import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';
import { z } from 'zod';

// Enhanced validation schema for pagination and search
const archivedUsersSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().max(100, 'Search term too long').optional().default('')
});

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string; securityLevel?: string }) {
  try {
    // Only allow GET for fetching archived users
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only GET method is allowed for fetching archived users',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate input with enhanced schema
    const validatedData = archivedUsersSchema.parse(req.query);
    const { page, limit, search } = validatedData;

    // Log admin archived users access
    console.log(`Admin archived users access`, {
      adminId: user.id,
      adminEmail: user.email,
      page,
      limit,
      search,
      timestamp: new Date().toISOString()
    });

    const offset = (page - 1) * limit;

    // Build the query with enhanced security
    const supabaseAdmin = await getSupabaseAdmin();
    let query = (await supabaseAdmin as any)
      .from('users')
      .select(`
        id,
        email,
        name,
        role,
        status,
        archived_at,
        archived_by,
        archiver:users!archived_by(name, email),
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('status', 'archived')
      .order('archived_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add search filter with sanitized input
    if (search && search.trim()) {
      const sanitizedSearch = search.replace(/[%_]/g, '\\$&'); // Escape SQL wildcards
      query = query.or(`name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%`);
    }

    const { data: archivedUsers, error, count } = await query;

    if (error) {
      console.error('Admin archived users fetch error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch archived users',
          details: process.env.NODE_ENV === 'development' ? error.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    // Log successful access
    console.log(`Admin archived users fetched successfully`, {
      adminId: user.id,
      resultCount: archivedUsers?.length || 0,
      totalCount: count || 0,
      timestamp: new Date().toISOString()
    });

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
    console.error('Admin archived users API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while fetching archived users',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply CMS security middleware and enhanced error handler
export default withErrorHandler(withCMSSecurity(handler));
