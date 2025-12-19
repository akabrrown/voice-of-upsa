import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';

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

  try {
    // Get session from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization token required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.substring(7);

    // Verify the token with Supabase
    const supabaseAdmin = await getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Get user data from users table
    // Note: We don't select 'permissions' column as it doesn't exist in the schema
    // Permissions are derived from the role
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>();

    if (userError) {
      // If user not found in users table, check if they're in auth metadata
      const userRole = user.user_metadata?.role || user.app_metadata?.role || 'user';
      
      console.log('CMS User API - User query error or not found:', userError?.message);
      console.log('CMS User API - Using metadata role:', userRole);
      
      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: userRole,
          permissions: getPermissionsForRole(userRole),
          lastActivity: new Date(),
          securityLevel: 'medium'
        },
        timestamp: new Date().toISOString()
      });
    } else {
      // User found in users table
      const userRole = userData?.role || 'user';
      
      console.log('CMS User API - User found in users table with role:', userRole);
      
      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: userRole,
          permissions: getPermissionsForRole(userRole),
          lastActivity: new Date(),
          securityLevel: 'medium'
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('CMS user API error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while fetching user data',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Helper to get permissions based on role
function getPermissionsForRole(role: string): string[] {
  const permissions = {
    admin: [
      'read:all', 'write:all', 'delete:all',
      'manage:users', 'manage:settings', 'manage:content',
      'manage:ads', 'view:analytics', 'export:data', 'import:data',
      'edit:articles', 'manage:articles', 'manage:comments'
    ],
    editor: [
      'read:content', 'write:content', 'delete:own_content',
      'manage:articles', 'manage:comments', 'upload:media', 'manage:content',
      'manage:messages', 'view:analytics', 'upload:logo', 'manage:ads', 'edit:articles',
      'manage:settings', 'manage:users'
    ],
    user: [
      'read:public', 'write:comments', 'manage:profile', 'upload:media', 'view:bookmarks'
    ]
  };

  return permissions[role as keyof typeof permissions] || [];
}

export default withErrorHandler(handler);
