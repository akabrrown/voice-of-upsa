import { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { supabaseAdmin } from '@/lib/database-server';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET and POST methods are allowed',
        details: 'Use GET with Authorization header or POST with token in body'
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Get token from body (POST) or Authorization header (GET)
    let token;
    if (req.method === 'POST') {
      token = req.body.token;
    } else {
      // GET method - extract from Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Token is required',
          details: 'Provide a valid JWT token to check admin status'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Step 1: Verify the JWT token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
          details: authError?.message || 'Token verification failed'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Step 2: Try to get user role with admin client (bypasses RLS)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, email, created_at')
      .eq('id', user.id)
      .single();

    const adminStatus = {
      isAuthenticated: true,
      userId: user.id,
      userEmail: user.email,
      userRole: null,
      isUserTableAccessible: !userError,
      userTableData: userData,
      userTableError: userError?.message || null,
      rlsStatus: 'unknown',
      recommendations: [] as string[]
    };

    // Step 3: Check if RLS is causing issues
    if (userError) {
      adminStatus.recommendations.push('RLS policies may be blocking access to users table');
      adminStatus.recommendations.push('Admin role check needs to bypass RLS or use different approach');
      
      // Try alternative approach using raw SQL
      try {
        const { data: sqlResult, error: sqlError } = await supabaseAdmin
          .rpc('get_user_role', { user_id: user.id });
          
        if (!sqlError && sqlResult) {
          adminStatus.userRole = sqlResult;
          adminStatus.recommendations.push('SQL function approach works - consider using RPC for role checks');
        } else {
          adminStatus.recommendations.push('SQL function also failed - RLS may need adjustment');
        }
      } catch {
        adminStatus.recommendations.push('RPC function not available - need to create one');
      }
    } else {
      adminStatus.userRole = userData?.role;
      adminStatus.recommendations.push('User role accessible via admin client');
    }

    // Step 4: Check RLS status
    try {
      const { data: rlsStatus } = await supabaseAdmin
        .from('pg_tables')
        .select('rowsecurity')
        .eq('schemaname', 'public')
        .eq('tablename', 'users')
        .single();
      
      adminStatus.rlsStatus = rlsStatus?.rowsecurity ? 'enabled' : 'disabled';
      
      if (rlsStatus?.rowsecurity) {
        adminStatus.recommendations.push('RLS is enabled on users table');
        adminStatus.recommendations.push('Ensure admin role bypasses RLS or uses service role key');
      }
    } catch {
      adminStatus.recommendations.push('Could not check RLS status');
    }

    // Step 5: Determine if user is admin
    const isAdmin = adminStatus.userRole === 'admin';
    
    return res.status(200).json({
      success: true,
      data: {
        ...adminStatus,
        isAdmin,
        isEditor: adminStatus.userRole === 'editor',
        hasAdminAccess: ['admin', 'editor'].includes(adminStatus.userRole || ''),
        nextSteps: isAdmin ? [
          'Admin role confirmed - access should work',
          'If still having issues, check specific endpoint permissions'
        ] : [
          'User is not admin - update role in users table',
          'Or create admin account with proper role'
        ]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin status check error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CHECK_FAILED',
        message: 'Failed to check admin status',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(handler);
