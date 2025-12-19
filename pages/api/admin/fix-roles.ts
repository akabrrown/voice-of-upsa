import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '../../../lib/database-server';
import { withErrorHandler } from '../../../lib/api/middleware/error-handler';

// Define types for user records
interface UserRecord {
  id: string;
  email: string;
  name: string | null;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Basic authentication check - verify user is logged in
    const admin = await getSupabaseAdmin();
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication token required',
          details: 'Please provide a valid Bearer token'
        },
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired authentication token',
          details: authError?.message
        },
        timestamp: new Date().toISOString()
      });
    }

    console.log('Role fix API: Authenticated user:', user.email);
    console.log('Role fix API: Starting role data investigation and repair...');
    
    // Step 1: Check current state of all tables
    console.log('Step 1: Investigating current database state...');
    
    // Check users table
    const { data: usersData, error: usersError } = await admin
      .from('users')
      .select('id, email, name, role, created_at')
      .limit(10);
    
    // Check user_profiles table  
    const { data: profilesData, error: profilesError } = await admin
      .from('user_profiles')
      .select('id, email, full_name, role, created_at')
      .limit(10);
    
    // Check auth.users metadata
    const { data: authUsers, error: listUsersError } = await admin.auth.admin.listUsers();
    
    console.log('Database investigation results:', {
      usersTable: { count: usersData?.length || 0, error: usersError?.message },
      profilesTable: { count: profilesData?.length || 0, error: profilesError?.message },
      authUsers: { count: authUsers.users.length || 0, error: listUsersError?.message }
    });
    
    // Step 2: Identify users with null roles
    const { data: nullRoleUsers } = await admin
      .from('users')
      .select('id, email, name')
      .is('role', null);
    
    console.log('Users with null roles:', {
      count: nullRoleUsers?.length || 0,
      users: nullRoleUsers
    });
    
    // Step 3: Attempt to repair role data
    const repairResults = [];
    
    if (nullRoleUsers && nullRoleUsers.length > 0) {
      console.log('Step 3: Attempting to repair role data...');
      
      for (const user of nullRoleUsers as UserRecord[]) {
        try {
          // Check if role exists in user_profiles
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: profileRole } = await (admin as any)
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .single() as { data: { role: string | null } | null; error: any };
          
          // Check auth metadata
          const { data: authUserData } = await admin.auth.admin.getUserById(user.id);
          const metadataRole = authUserData.user?.user_metadata?.role;
          
          // Determine best role
          let finalRole = 'user'; // default
          if (profileRole?.role) {
            finalRole = profileRole.role;
          } else if (metadataRole) {
            finalRole = metadataRole;
          }
          
          // Update users table
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: updateError } = await (admin as any)
            .from('users')
            .update({ 
              role: finalRole,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
          
          repairResults.push({
            userId: user.id,
            email: user.email,
            profileRole: profileRole?.role,
            metadataRole: metadataRole,
            finalRole: finalRole,
            success: !updateError,
            error: updateError?.message
          });
          
        } catch (error) {
          repairResults.push({
            userId: user.id,
            email: user.email,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
    
    // Step 4: Verify repair results
    const { data: afterRepairUsers } = await admin
      .from('users')
      .select('id, email, role')
      .is('role', null);
    
    console.log('Post-repair null roles:', {
      count: afterRepairUsers?.length || 0,
      users: afterRepairUsers
    });
    
    return res.status(200).json({
      success: true,
      message: 'Role investigation and repair completed',
      data: {
        investigation: {
          usersTable: { count: usersData?.length || 0, sample: usersData },
          profilesTable: { count: profilesData?.length || 0, sample: profilesData },
          authUsers: { count: authUsers.users.length || 0 }
        },
        nullRolesFound: {
          count: nullRoleUsers?.length || 0,
          users: nullRoleUsers
        },
        repairResults: repairResults,
        verification: {
          remainingNullRoles: afterRepairUsers?.length || 0,
          users: afterRepairUsers
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Role fix API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fix role data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply middleware - just error handling, no special permissions required
export default withErrorHandler(handler);
