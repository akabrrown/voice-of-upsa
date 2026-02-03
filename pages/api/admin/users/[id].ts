import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, CMSUser } from '@/lib/security/cms-security';
import { z } from 'zod';

// Define Supabase client type for better type safety
type TypedSupabaseClient = {
  from: (table: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

// Enhanced validation schema with security constraints
const roleUpdateSchema = z.object({
  role: z.enum(['user', 'admin', 'editor'])
});

const statusUpdateSchema = z.object({
  status: z.enum(['active', 'archived', 'suspended'])
});

const deleteUserSchema = z.object({
  permanent: z.boolean().default(false),
  confirmation: z.string().min(1, 'Confirmation text is required')
});

const setPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password must be less than 128 characters')
});

// Define user update interface for better type safety
interface UserUpdateData {
  role?: string;
  status?: string;
  updated_at?: string;
  [key: string]: unknown;
}

async function handler(req: NextApiRequest, res: NextApiResponse, requesterUser: CMSUser) {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    if (!supabaseAdmin) {
      throw new Error('Failed to initialize Supabase admin client');
    }

    // Validate user ID
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: 'Valid user ID is required',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // GET - Fetch single user
    if (req.method === 'GET') {
      const { data, error } = await (supabaseAdmin as unknown as TypedSupabaseClient)
        .from('users')
        .select('id, email, name, role, status, avatar_url, bio, last_sign_in, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`User fetch failed for admin ${requesterUser.email}:`, error);
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            details: process.env.NODE_ENV === 'development' ? (error as { message?: string }).message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({
        success: true,
        data: { user: data },
        timestamp: new Date().toISOString()
      });
    }

    // PUT/PATCH - Update user role or status
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const validatedRole = roleUpdateSchema.safeParse(req.body);
      const validatedStatus = statusUpdateSchema.safeParse(req.body);
      
      if (!validatedRole.success && !validatedStatus.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Valid role or status field required'
          },
          timestamp: new Date().toISOString()
        });
      }

      const updateData: UserUpdateData = {
        updated_at: new Date().toISOString()
      };
      
      if (validatedRole.success) {
        updateData.role = validatedRole.data.role;
      }

      if (validatedStatus.success) {
        updateData.status = validatedStatus.data.status;
      }
      
      const { data: updatedUser, error } = await (supabaseAdmin as unknown as TypedSupabaseClient)
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update user',
            details: error.message
          },
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(200).json({
        success: true,
        data: {
          message: 'User updated successfully',
          user: updatedUser
        },
        timestamp: new Date().toISOString()
      });
    }

    // DELETE - Archive or permanently delete user
    if (req.method === 'DELETE') {
      // Prevent admin from deleting themselves
      if (requesterUser.id === id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_DELETE_SELF',
            message: 'Cannot delete your own account'
          },
          timestamp: new Date().toISOString()
        });
      }

      // Validate input to determine operation type
      const validatedData = deleteUserSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid input data',
            details: validatedData.error.errors
          },
          timestamp: new Date().toISOString()
        });
      }

      const { permanent, confirmation } = validatedData.data;

      // Get the user to be deleted
      const { data: userToDelete, error: fetchError } = await (supabaseAdmin as unknown as TypedSupabaseClient)
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError || !userToDelete) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          },
          timestamp: new Date().toISOString()
        });
      }

      const typedUserToDelete = userToDelete as { id: string; role: string; email: string };

      if (permanent) {
        if (confirmation.toLowerCase() !== 'delete') {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_CONFIRMATION',
              message: 'Confirmation text must be "delete" for permanent deletion'
            },
            timestamp: new Date().toISOString()
          });
        }

        // Prevent deleting the last admin
        if (typedUserToDelete.role === 'admin') {
          const { count } = await (supabaseAdmin as unknown as TypedSupabaseClient)
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'admin');

          if (count && count <= 1) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'LAST_ADMIN',
                message: 'Cannot delete the last admin user'
              },
              timestamp: new Date().toISOString()
            });
          }
        }

        // Delete from auth system
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (authError) {
          throw authError;
        }

        // Delete from DB
        const { error: dbError } = await (supabaseAdmin as unknown as TypedSupabaseClient)
          .from('users')
          .delete()
          .eq('id', id);
        
        if (dbError) {
          throw dbError;
        }

        return res.status(200).json({
          success: true,
          data: { message: 'User permanently deleted successfully' },
          timestamp: new Date().toISOString()
        });
      } else {
        // Archive
        const { data: archivedUser, error } = await (supabaseAdmin as unknown as TypedSupabaseClient)
          .from('users')
          .update({ 
            status: 'archived',
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select('*')
          .single();

        if (error) {
          throw error;
        }

        return res.status(200).json({
          success: true,
          data: { 
            message: 'User archived successfully',
            user: archivedUser
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    // POST - Restore user
    if (req.method === 'POST') {
      const { data: restoredUser, error } = await (supabaseAdmin as unknown as TypedSupabaseClient)
        .from('users')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        data: { 
          message: 'User restored successfully',
          user: restoredUser
        },
        timestamp: new Date().toISOString()
      });
    }

    // POST - Set password (not standard but handled here in previous version)
    // Actually the previous version had PATCH for password
    if (req.method === 'PATCH' && req.body.password) {
      const validatedData = setPasswordSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid password data'
          },
          timestamp: new Date().toISOString()
        });
      }

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        id,
        { password: validatedData.data.password }
      );

      if (authError) {
        throw authError;
      }

      return res.status(200).json({
        success: true,
        data: { message: 'User password set successfully' },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
    });

  } catch (error) {
    console.error(`User API error:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'manage:users',
  auditAction: 'user_management_action'
}));
