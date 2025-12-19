import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '../../../../lib/database-server';
import { withErrorHandler } from '../../../../lib/api/middleware/error-handler';
import { withCMSSecurity, CMSUser } from '../../../../lib/security/cms-security';
import { z } from 'zod';

// Define Supabase client type for better type safety
type TypedSupabaseClient = {
  from: (table: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

// Validation schema for query parameters
const usersQuerySchema = z.object({
  role: z.enum(['all', 'user', 'admin', 'editor']).default('all'),
  status: z.enum(['all', 'active', 'archived']).default('all'),
  page: z.coerce.number().min(1).default(1),
  search: z.string().max(100, 'Search term too long').optional()
});

async function handler(req: NextApiRequest, res: NextApiResponse, user: CMSUser) {
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

  try {
    // Get supabase admin client
    const supabaseAdmin = await getSupabaseAdmin();
    if (!supabaseAdmin) {
      console.error('Admin users API: Failed to get Supabase admin client');
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_CONNECTION_FAILED',
          message: 'Failed to connect to database',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    console.log(`Admin users API: Access granted for user: ${user.email} (${user.id})`);

    // Validate query parameters
    const validatedParams = usersQuerySchema.parse(req.query);
    const { role, status, page, search } = validatedParams;

    const pageNum = page;
    const limitNum = 20;
    const offset = (pageNum - 1) * limitNum;

    let data: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    let totalCount = 0;
    let queryError = null;

    try {
      const { data: queryData, error: fetchError } = await (supabaseAdmin as unknown as TypedSupabaseClient)
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);
      
      if (fetchError) {
        queryError = fetchError;
        console.error('Admin users API: Query failed:', fetchError);
      } else {
        data = queryData || [];
      }

      // Try to get count if main query succeeded
      if (!queryError) {
        try {
          let countQuery = (supabaseAdmin as unknown as TypedSupabaseClient).from('users').select('*', { count: 'exact', head: true });
          
          if (role !== 'all') {
            countQuery = countQuery.eq('role', role);
          }
          
          if (status !== 'all') {
            if (status === 'archived') {
              countQuery = countQuery.not('archived_at', 'is', null);
            } else if (status === 'active') {
              countQuery = countQuery.is('archived_at', null);
            }
          }
          
          if (search) {
            const sanitizedSearch = search.replace(/[%_]/g, '\\$&');
            countQuery = countQuery.or(`name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%`);
          }

          const { count } = await countQuery;
          totalCount = count || 0;
        } catch (countError) {
          console.warn('Admin users API: Count query failed, using data length:', countError);
          totalCount = data.length;
        }
      }

    } catch (error) {
      queryError = error;
      console.error('Admin users API: Database query exception:', error);
    }

    // If we have a query error, return empty results
    if (queryError) {
      return res.status(200).json({
        success: true,
        data: {
          users: [],
          pagination: {
            currentPage: pageNum,
            totalPages: 0,
            totalUsers: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Map users table fields to frontend expected structure
    const sanitizedUsers = (await Promise.all((data || []).map(async (userRecord: {
      id: string;
      email: string;
      name?: string | null;
      role?: string | null;
      status?: string | null;
      is_active?: boolean;
      created_at: string;
      updated_at: string;
      last_sign_in?: string | null;
      security_level?: string | null;
      password_strength_score?: number | null;
      avatar_url?: string | null;
      archived_at?: string | null;
    }) => {
      if (!userRecord) return null;
      
      const role = userRecord.role || 'user';
      
      return {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name || 'Unknown',
        role: role as 'admin' | 'editor' | 'user',
        is_active: userRecord.status === 'active' || (userRecord.status === undefined && userRecord.archived_at === null),
        created_at: userRecord.created_at,
        updated_at: userRecord.updated_at,
        last_login_at: userRecord.last_sign_in,
        avatar_url: userRecord.avatar_url,
      };
    }))).filter(u => u !== null);

    return res.status(200).json({
      success: true,
      data: {
        users: sanitizedUsers,
        pagination: {
          currentPage: pageNum,
          totalPages: totalCount ? Math.ceil(totalCount / limitNum) : 0,
          totalUsers: totalCount || 0,
          hasNextPage: (offset + limitNum) < (totalCount || 0),
          hasPreviousPage: pageNum > 1
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Users endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while fetching users',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'manage:users',
  auditAction: 'users_list'
}));
