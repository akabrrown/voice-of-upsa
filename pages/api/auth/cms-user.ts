import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '../../../lib/database-server';
import { withErrorHandler } from '../../../lib/api/middleware/error-handler';
import { getUserFromToken } from '../../../lib/auth';

interface SupabaseError {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * API endpoint to verify CMS access and return user information
 * Used by frontend hooks for authentication and authorization
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET requests are allowed',
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid Authorization header',
        },
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
        timestamp: new Date().toISOString()
      });
    }

    console.log(`[${new Date().toISOString()}] CMS auth endpoint called for user ID:`, user.id);
    
    // Get user role from profile using supabaseAdmin
    let userRole = 'user';
    try {
      console.log(`[${new Date().toISOString()}] Fetching profile for user ID:`, user.id);
      
      // Use supabaseAdmin to fetch from users table (same as working profile API)
      const admin = await getSupabaseAdmin();
      
      // First, let's check what tables exist and query the user_profiles table too
      console.log(`[${new Date().toISOString()}] Checking user role in multiple tables...`);
      
      // Try users table first
      const { data: userProfile, error: userError } = await admin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single() as { data: { role: string } | null; error: SupabaseError | null };
      
      console.log(`[${new Date().toISOString()}] Users table result:`, { userProfile, userError });
      
      // Also try user_profiles table in case role is stored there
      const { data: profileData, error: profileError } = await admin
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single() as { data: { role: string } | null; error: SupabaseError | null };
      
      console.log(`[${new Date().toISOString()}] User_profiles table result:`, { profileData, profileError });
      
      // Enhanced role determination logic
      console.log(`[${new Date().toISOString()}] Role determination - userProfile:`, userProfile);
      console.log(`[${new Date().toISOString()}] Role determination - profileData:`, profileData);
      
      // Prioritize users table over user_profiles table
      if (userProfile?.role) {
        userRole = userProfile.role;
        console.log(`[${new Date().toISOString()}] Found user role from users table:`, userRole);
      } else if (profileData?.role) {
        userRole = profileData.role;
        console.log(`[${new Date().toISOString()}] Found user role from user_profiles table:`, userRole);
      } else {
        console.log(`[${new Date().toISOString()}] No role found in any table, using default:`, userRole);
        console.log(`[${new Date().toISOString()}] Errors - users:`, userError, 'profiles:', profileError);
      }
    } catch (profileError) {
      console.error(`[${new Date().toISOString()}] Could not fetch user profile, defaulting to user role:`, profileError);
    }
    
    // Create CMS user object
    const cmsUser = {
      id: user.id,
      email: user.email || 'unknown@example.com',
      role: userRole,
      permissions: getPermissionsForRole(userRole),
      lastActivity: new Date(),
      securityLevel: getSecurityLevelForRole(userRole)
    };

    // Return user information for frontend
    const response = {
      success: true,
      user: {
        id: cmsUser.id,
        email: cmsUser.email,
        role: cmsUser.role,
        permissions: cmsUser.permissions,
        securityLevel: cmsUser.securityLevel,
        lastActivity: cmsUser.lastActivity.toISOString()
      },
      timestamp: new Date().toISOString()
    };
    
    console.log(`[${new Date().toISOString()}] CMS auth endpoint returning:`, response);
    
    return res.status(200).json(response);

  } catch (error) {
    console.error('CMS User verification failed:', error);
    
    return res.status(401).json({
      success: false,
      error: {
        code: 'CMS_ACCESS_DENIED',
        message: error instanceof Error ? error.message : 'Access denied',
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Helper functions for role-based permissions
function getPermissionsForRole(role: string): string[] {
  switch (role) {
    case 'admin':
      return [
        'manage:users', 'manage:articles', 'manage:settings', 
        'manage:cms', 'manage:ads', 'manage:analytics',
        'write:content', 'upload:media', 'edit:content', 'delete:content'
      ];
    case 'editor':
      return [
        'manage:articles', 'manage:own_articles', 'manage:ads',
        'write:content', 'upload:media', 'edit:content'
      ];
    default:
      return ['view:articles', 'view:bookmarks'];
  }
}

function getSecurityLevelForRole(role: string): 'low' | 'medium' | 'high' {
  switch (role) {
    case 'admin':
      return 'high';
    case 'editor':
      return 'medium';
    default:
      return 'low';
  }
}

// Apply basic error handler only - no CMS security middleware to avoid circular dependency
export default withErrorHandler(handler);
