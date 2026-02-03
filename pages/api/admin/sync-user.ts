import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, CMSUser } from '@/lib/security/cms-security';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface SupabaseOperationResult<T> {
  data: T | null;
  error: { message: string } | null;
}

/**
 * Interface to describe the specific subset of Supabase functionality used here.
 * This helps avoid 'any' and complex inline assertions.
 */
interface SupabaseUsersProxy {
  from(table: 'users'): {
    update(data: { role: string; updated_at: string }): {
      eq(column: 'id', value: string): {
        select(): {
          single(): Promise<SupabaseOperationResult<UserData>>;
        };
      };
    };
    insert(data: { id: string; email: string; name: string; role: string; created_at: string; updated_at: string }): {
      select(): {
        single(): Promise<SupabaseOperationResult<UserData>>;
      };
    };
  };
}
async function handler(req: NextApiRequest, res: NextApiResponse, requesterUser: CMSUser) {
  // Get Supabase admin client
  const supabaseAdmin = await getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Database connection failed');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST method is allowed' }
    });
  }

  try {
    // Get target role and target userId from body (default to requester if not provided)
    const { role = 'user', userId = requesterUser.id } = req.body;

    // SECURITY: Only admins can assign roles to others OR set a role other than 'user'
    if (requesterUser.role !== 'admin' && (userId !== requesterUser.id || role !== 'user')) {
      // Allow elevation ONLY if no admins exist yet (initial setup)
      const { count } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');
        
      if (count && count > 0) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only admins can manage roles' }
        });
      }
    }

    // Check if user already exists in users table
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', requesterUser.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Sync user API - Error checking existing user:', fetchError);
    }

    if (existingUser) {
      // Update existing user's role
      console.log('Sync user API - Updating existing user role to:', role);
      
      const usersTable = (supabaseAdmin as unknown as SupabaseUsersProxy).from('users');
      const { data: updatedUser, error: updateError } = await usersTable
        .update({ 
          role: role,
          updated_at: new Date().toISOString()
        })
        .eq('id', requesterUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('Sync user API - Update error:', updateError);
        return res.status(500).json({
          success: false,
          error: { 
            code: 'UPDATE_FAILED', 
            message: 'Failed to update user role',
            details: updateError.message
          }
        });
      }

      return res.status(200).json({
        success: true,
        message: `User role updated to '${role}'`,
        data: { user: updatedUser }
      });
    } else {
      // Insert new user
      console.log('Sync user API - Creating new user with role:', role);
      
      if (!requesterUser.email) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'INVALID_USER', 
            message: 'User email is required' 
          }
        });
      }

      // Safe name extraction
      const userName = (requesterUser as CMSUser & { name?: string }).name || 
                       requesterUser.email.split('@')[0] || 
                       'User';
      
      const usersTable = (supabaseAdmin as unknown as SupabaseUsersProxy).from('users');
      const { data: newUser, error: insertError } = await usersTable
        .insert({
          id: requesterUser.id,
          email: requesterUser.email,
          name: userName,
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Sync user API - Insert error:', insertError);
        return res.status(500).json({
          success: false,
          error: { 
            code: 'INSERT_FAILED', 
            message: 'Failed to create user',
            details: insertError.message
          }
        });
      }

      return res.status(201).json({
        success: true,
        message: `User created with role '${role}'`,
        data: { user: newUser }
      });
    }

  } catch (error) {
    console.error('Sync user API error:', error);
    return res.status(500).json({
      success: false,
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An unexpected error occurred',
        details: (error as Error).message
      }
    });
  }
}

export default withErrorHandler(withCMSSecurity(handler, {
  auditAction: 'user_sync'
}));
