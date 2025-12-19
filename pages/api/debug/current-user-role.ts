import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '../../../lib/database-server';
import { withErrorHandler } from '../../../lib/api/middleware/error-handler';
import { withCMSSecurity } from '../../../lib/security/cms-security';

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string }) {
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
    console.log('Debug current user role: Starting investigation for user:', user.id, user.email);
    
    const admin = await getSupabaseAdmin();
    
    // Check users table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: usersData, error: usersError } = await (admin as any)
      .from('users')
      .select('*')
      .eq('id', user.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .single() as { data: { role: string } | null; error: any };
    
    console.log('Users table result:', { usersData, usersError });
    
    // Check user_profiles table  
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profilesData, error: profilesError } = await (admin as any)
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .single() as { data: { role: string } | null; error: any };
    
    console.log('User_profiles table result:', { profilesData, profilesError });
    
    // Check auth.users metadata
    const { data: authUserData } = await admin.auth.admin.getUserById(user.id);
    
    console.log('Auth users result:', {
      userMetadata: authUserData.user?.user_metadata,
      appMetadata: authUserData.user?.app_metadata
    });
    
    // Determine what role should be used
    let finalRole = 'user';
    let roleSource = 'default';
    
    if (usersData?.role) {
      finalRole = usersData.role;
      roleSource = 'users table';
    } else if (profilesData?.role) {
      finalRole = profilesData.role;
      roleSource = 'user_profiles table';
    } else if (authUserData.user?.user_metadata?.role) {
      finalRole = authUserData.user.user_metadata.role;
      roleSource = 'auth user_metadata';
    } else if (authUserData.user?.app_metadata?.role) {
      finalRole = authUserData.user.app_metadata.role;
      roleSource = 'auth app_metadata';
    }
    
    console.log('Final role determination:', { finalRole, roleSource });
    
    return res.status(200).json({
      success: true,
      data: {
        currentUser: {
          id: user.id,
          email: user.email
        },
        usersTable: {
          data: usersData,
          error: usersError?.message
        },
        userProfilesTable: {
          data: profilesData,
          error: profilesError?.message
        },
        authMetadata: {
          userMetadata: authUserData.user?.user_metadata,
          appMetadata: authUserData.user?.app_metadata
        },
        roleDetermination: {
          finalRole,
          roleSource,
          availableRoles: {
            usersTable: usersData?.role,
            userProfilesTable: profilesData?.role,
            authUserMetadata: authUserData.user?.user_metadata?.role,
            authAppMetadata: authUserData.user?.app_metadata?.role
          }
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Debug current user role error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to debug current user role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply middleware
export default withErrorHandler(withCMSSecurity(handler));
