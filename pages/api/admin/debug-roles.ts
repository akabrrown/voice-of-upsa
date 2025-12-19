import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '../../../lib/database-server';
import { withErrorHandler } from '../../../lib/api/middleware/error-handler';

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
    console.log('Debug roles API: Starting investigation...');
    
    const admin = await getSupabaseAdmin();
    
    // Step 1: Check current state of users table
    const { data: usersData, error: usersError } = await admin
      .from('users')
      .select('id, email, name, role, created_at')
      .limit(10);
    
    // Step 2: Check user_profiles table  
    const { data: profilesData, error: profilesError } = await admin
      .from('user_profiles')
      .select('id, email, full_name, role, created_at')
      .limit(10);
    
    // Step 3: Identify users with null roles
    const { data: nullRoleUsers } = await admin
      .from('users')
      .select('id, email, name, role')
      .is('role', null)
      .limit(10);
    
    // Step 4: Check auth.users metadata for sample users
    const authMetadataSamples = [];
    if (nullRoleUsers && nullRoleUsers.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const user of nullRoleUsers.slice(0, 3) as any[]) {
        try {
          const { data: authUserData } = await admin.auth.admin.getUserById(user.id);
          authMetadataSamples.push({
            userId: user.id,
            email: user.email,
            userMetadata: authUserData.user?.user_metadata,
            appMetadata: authUserData.user?.app_metadata
          });
        } catch (error) {
          authMetadataSamples.push({
            userId: user.id,
            email: user.email,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Role investigation completed',
      data: {
        usersTable: {
          count: usersData?.length || 0,
          sample: usersData,
          error: usersError?.message
        },
        profilesTable: {
          count: profilesData?.length || 0,
          sample: profilesData,
          error: profilesError?.message
        },
        nullRolesFound: {
          count: nullRoleUsers?.length || 0,
          sample: nullRoleUsers
        },
        authMetadataSamples: authMetadataSamples
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Debug roles API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to investigate role data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply middleware
export default withErrorHandler(handler);
