import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity, getCMSRateLimit, CMSUser } from '@/lib/security/cms-security';
import { getClientIP } from '@/lib/security/auth-security';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Enhanced validation schema with security constraints
const roleUpdateSchema = z.object({
  role: z.enum(['user', 'admin', 'editor'])
});

const statusUpdateSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended'])
});

const archiveUserSchema = z.object({
  reason: z.string().regex(/^[^<>]{0,500}$/, 'Reason cannot contain HTML tags and must be less than 500 characters').optional()
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

async function handler(req: NextApiRequest, res: NextApiResponse, user: CMSUser) {
  try {
    // Apply rate limiting based on method
    const rateLimit = getCMSRateLimit(req.method || 'GET');
    const rateLimitMiddleware = withRateLimit(rateLimit.requests, rateLimit.window, (req: NextApiRequest) => 
      getClientIP(req)
    );
    rateLimitMiddleware(req);

    // Log user access
    console.log(`Admin user [${req.query.id}] accessed by user: ${user.email} (${user.id})`, {
      method: req.method,
      timestamp: new Date().toISOString(),
      securityLevel: user.securityLevel
    });

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
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, email, name, role, status, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`User fetch failed for admin ${user.email}:`, error);
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            details: process.env.NODE_ENV === 'development' ? error.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Sanitize user data
      const sanitizedUser = {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      console.log(`User [${id}] returned to admin: ${user.email}`, {
        userEmail: data.email,
        role: data.role,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { user: sanitizedUser },
        timestamp: new Date().toISOString()
      });
    }

    // PUT/PATCH - Update user role or status
    if (req.method === 'PUT' || req.method === 'PATCH') {
      // Authorize admin access only
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Validate input based on request body
      const validatedRole = roleUpdateSchema.safeParse(req.body);
      const validatedStatus = statusUpdateSchema.safeParse(req.body);

      if (!validatedRole.success && !validatedStatus.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Valid role or status field required',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      const updateData: UserUpdateData = {};
      
      if (validatedRole.success) {
        const { role } = validatedRole.data;
        
        // Prevent admin from removing their own admin role
        if (user.id === id && role !== 'admin') {
          return res.status(400).json({
            success: false,
            error: {
              code: 'CANNOT_REMOVE_OWN_ADMIN_ROLE',
              message: 'Cannot remove your own admin role',
              details: null
            },
            timestamp: new Date().toISOString()
          });
        }
        
        updateData.role = role;
      }

      if (validatedStatus.success) {
        const { status } = validatedStatus.data;
        
        // Prevent admin from deactivating themselves
        if (user.id === id && status !== 'active') {
          return res.status(400).json({
            success: false,
            error: {
              code: 'CANNOT_DEACTIVATE_SELF',
              message: 'Cannot deactivate your own account',
              details: null
            },
            timestamp: new Date().toISOString()
          });
        }
        
        updateData.status = status;
      }
            // Get target user to ensure they exist
      const { data: targetUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('id, role, status, email, name')
        .eq('id', id)
        .single();

      if (fetchError || !targetUser) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            details: process.env.NODE_ENV === 'development' ? fetchError.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Update user
      const { data: updatedUser, error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select('id, email, name, role, status, created_at, updated_at')
        .single();

      if (error) {
        console.error(`User update failed for admin ${user.email}:`, error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'USER_UPDATE_FAILED',
            message: 'Failed to update user',
            details: process.env.NODE_ENV === 'development' ? error.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Log user update
      console.info(`User updated by admin: ${user.email}`, {
        targetUserId: id,
        targetUserEmail: targetUser.email,
        changes: updateData,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { user: updatedUser },
        timestamp: new Date().toISOString()
      });
    }

    // DELETE - Archive or permanently delete user
    if (req.method === 'DELETE') {
      // Authorize admin access only
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Prevent admin from deleting themselves
      if (user.id === id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_DELETE_SELF',
            message: 'Cannot delete your own account',
            details: null
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
      const { data: userToDelete, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        console.error(`User fetch failed for admin ${user.email}:`, fetchError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'USER_FETCH_FAILED',
            message: 'Failed to fetch user information',
            details: process.env.NODE_ENV === 'development' ? fetchError.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      if (!userToDelete) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // For permanent deletion, prevent deleting the last admin
      if (permanent && userToDelete.role === 'admin') {
        const { data: adminCount, error: adminCountError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('role', 'admin')
          .eq('status', 'active');

        if (adminCountError) {
          console.error('Admin count check error:', adminCountError);
          return res.status(500).json({
            success: false,
            error: {
              code: 'ADMIN_COUNT_ERROR',
              message: 'Failed to verify admin count',
              details: process.env.NODE_ENV === 'development' ? adminCountError.message : null
            },
            timestamp: new Date().toISOString()
          });
        }

        if (adminCount && adminCount.length <= 1) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'LAST_ADMIN',
              message: 'Cannot delete the last admin user',
              details: 'At least one active admin user must remain in the system'
            },
            timestamp: new Date().toISOString()
          });
        }
      }

      if (permanent) {
        // Validate confirmation text for permanent deletion
        if (confirmation.toLowerCase() !== 'delete') {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_CONFIRMATION',
              message: 'Confirmation text must be "delete" for permanent deletion',
              details: null
            },
            timestamp: new Date().toISOString()
          });
        }

        // Delete user from auth system first
        try {
          const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
          
          if (authDeleteError) {
            console.error('Auth deletion error:', authDeleteError);
            return res.status(500).json({
              success: false,
              error: {
                code: 'AUTH_DELETE_ERROR',
                message: 'Failed to delete user from authentication system',
                details: process.env.NODE_ENV === 'development' ? authDeleteError.message : null
              },
              timestamp: new Date().toISOString()
            });
          }
        } catch (authError) {
          console.error('Auth deletion error:', authError);
          return res.status(500).json({
            success: false,
            error: {
              code: 'AUTH_DELETE_ERROR',
              message: 'Failed to delete user from authentication system',
              details: process.env.NODE_ENV === 'development' ? (authError as Error).message : null
            },
            timestamp: new Date().toISOString()
          });
        }

        // Delete user from database
        const { error: deleteError } = await supabaseAdmin
          .from('users')
          .delete()
          .eq('id', id);

        if (deleteError) {
          console.error('Database deletion error:', deleteError);
          return res.status(500).json({
            success: false,
            error: {
              code: 'DELETE_ERROR',
              message: 'Failed to delete user from database',
              details: process.env.NODE_ENV === 'development' ? deleteError.message : null
            },
            timestamp: new Date().toISOString()
          });
        }

        // Log permanent user deletion
        console.info(`User permanently deleted by admin: ${user.email}`, {
          targetUserId: id,
          targetUserEmail: userToDelete.email,
          timestamp: new Date().toISOString()
        });

        return res.status(200).json({
          success: true,
          data: { 
            message: 'User permanently deleted successfully',
            deletedUser: userToDelete
          },
          timestamp: new Date().toISOString()
        });
      } else {
        // Archive user by setting status to 'inactive'
        const { data: archivedUser, error } = await supabaseAdmin
          .from('users')
          .update({ 
            status: 'inactive',
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select('id, email, name, role, status, updated_at')
          .single();

        if (error) {
          console.error(`User archive failed for admin ${user.email}:`, error);
          return res.status(500).json({
            success: false,
            error: {
              code: 'USER_ARCHIVE_FAILED',
              message: 'Failed to archive user',
              details: process.env.NODE_ENV === 'development' ? error.message : null
            },
            timestamp: new Date().toISOString()
          });
        }

        // Log user archiving
        console.info(`User archived by admin: ${user.email}`, {
          targetUserId: id,
          targetUserEmail: archivedUser.email,
          reason: confirmation || 'No reason provided',
          timestamp: new Date().toISOString()
        });

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
      // Authorize admin access only
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Restore user by setting status to 'active'
      const { data: restoredUser, error } = await supabaseAdmin
        .from('users')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id, email, name, role, status, updated_at')
        .single();

      if (error) {
        console.error(`User restore failed for admin ${user.email}:`, error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'USER_RESTORE_FAILED',
            message: 'Failed to restore user',
            details: process.env.NODE_ENV === 'development' ? error.message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Log user restoration
      console.info(`User restored by admin: ${user.email}`, {
        targetUserId: id,
        targetUserEmail: restoredUser.email,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { 
          message: 'User restored successfully',
          user: restoredUser
        },
        timestamp: new Date().toISOString()
      });
    }

    // PATCH - Set user password
    if (req.method === 'PATCH') {
      // Authorize admin access only
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
            details: null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Validate input for password setting
      const validatedData = setPasswordSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid password data',
            details: validatedData.error.errors
          },
          timestamp: new Date().toISOString()
        });
      }

      const { password } = validatedData.data;

      // Set user password in auth system
      try {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          id,
          { password }
        );

        if (authError) {
          console.error('Password setting error:', authError);
          return res.status(500).json({
            success: false,
            error: {
              code: 'PASSWORD_SET_FAILED',
              message: 'Failed to set user password',
              details: process.env.NODE_ENV === 'development' ? authError.message : null
            },
            timestamp: new Date().toISOString()
          });
        }

        // Log password setting
        console.info(`User password set by admin: ${user.email}`, {
          targetUserId: id,
          timestamp: new Date().toISOString()
        });

        return res.status(200).json({
          success: true,
          data: { 
            message: 'User password set successfully'
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Password setting error:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'PASSWORD_SET_FAILED',
            message: 'Failed to set user password',
            details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET, PUT, PATCH, DELETE, and POST methods are allowed',
        details: null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`User API error for admin ${user.email}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing user request',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Apply enhanced CMS security middleware and error handler
export default withErrorHandler(withCMSSecurity(handler, {
  requirePermission: 'manage:users',
  auditAction: 'user_accessed'
}));
              
