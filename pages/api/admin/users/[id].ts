import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
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

async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  try {
    console.log(`=== ADMIN USER [${req.query.id}] API DEBUG START ===`);
    console.log('Request details:', {
      method: req.method,
      url: req.url,
      query: req.query,
      headers: {
        authorization: req.headers.authorization ? '[REDACTED]' : 'MISSING',
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent']
      },
      body: req.body
    });

    // Use withCMSSecurity once we re-enable it, but for now let's at least get the session correctly
    const supabaseAdmin = await getSupabaseAdmin();
    if (!supabaseAdmin) {
      throw new Error('Failed to initialize Supabase admin client');
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' }
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or expired session' }
      });
    }

    // Get the user from our database to check their role
    const { data: dbUser, error: dbError } = await (supabaseAdmin as unknown as TypedSupabaseClient)
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (dbError || !dbUser) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions or user not found' }
      });
    }

    const userData = dbUser as { role: string };
    if (userData.role !== 'admin' && userData.role !== 'editor') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      });
    }

    const user = {
      id: authUser.id,
      email: authUser.email!,
      role: userData.role as 'admin' | 'editor' | 'user'
    };

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
      const supabaseAdmin = await getSupabaseAdmin() as unknown as TypedSupabaseClient;
      const { data, error } = await (supabaseAdmin as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .from('users')
        .select('id, email, name, role, status, avatar_url, bio, last_sign_in, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`User fetch failed for admin ${user.email}:`, error);
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

      // Sanitize user data
      const detailedUserData = data as {
        id: string;
        email: string;
        name: string;
        role: string;
        status: string;
        avatar_url: string | null;
        bio: string | null;
        last_sign_in: string | null;
        created_at: string;
        updated_at: string;
      };
      const sanitizedUser = {
        id: detailedUserData.id,
        email: detailedUserData.email,
        name: detailedUserData.name,
        role: detailedUserData.role,
        status: detailedUserData.status,
        avatar_url: detailedUserData.avatar_url,
        bio: detailedUserData.bio,
        last_sign_in: detailedUserData.last_sign_in,
        created_at: detailedUserData.created_at,
        updated_at: detailedUserData.updated_at
      };

      console.log(`User [${id}] returned to admin: ${user.email}`, {
        userEmail: detailedUserData.email,
        role: detailedUserData.role,
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
      // TEMPORARILY BYPASS ADMIN ROLE CHECK FOR DEBUGGING
      console.log('=== PATCH REQUEST: BYPASSING ADMIN ROLE CHECK ===');
      
      // Validate input based on request body
      console.log('=== PATCH REQUEST: VALIDATING INPUT ===');
      console.log('Request body:', req.body);
      
      const validatedRole = roleUpdateSchema.safeParse(req.body);
      const validatedStatus = statusUpdateSchema.safeParse(req.body);
      
      console.log('Validation results:', {
        roleValidation: validatedRole.success,
        statusValidation: validatedStatus.success,
        roleData: validatedRole.data,
        statusData: validatedStatus.data
      });

      if (!validatedRole.success && !validatedStatus.success) {
        console.log('=== PATCH REQUEST: VALIDATION FAILED ===');
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Valid role or status field required',
            details: {
              roleError: validatedRole.error,
              statusError: validatedStatus.error
            }
          },
          timestamp: new Date().toISOString()
        });
      }

      const updateData: UserUpdateData = {};
      
      if (validatedRole.success) {
        const { role } = validatedRole.data;
        console.log('=== PATCH REQUEST: UPDATING ROLE TO ===', role);
        
        // TEMPORARILY BYPASS SELF-ADMIN ROLE CHECK
        console.log('=== PATCH REQUEST: BYPASSING SELF-ADMIN ROLE CHECK ===');
        
        updateData.role = role;
      }

      if (validatedStatus.success) {
        const { status } = validatedStatus.data;
        console.log('=== PATCH REQUEST: UPDATING STATUS TO ===', status);
        
        // TEMPORARILY BYPASS SELF-DEACTIVATION CHECK
        console.log('=== PATCH REQUEST: BYPASSING SELF-DEACTIVATION CHECK ===');
        
        updateData.status = status;
      }
      
      console.log('=== PATCH REQUEST: UPDATE DATA ===', updateData);
      
      // TEMPORARILY BYPASS DATABASE OPERATIONS FOR DEBUGGING
      console.log('=== PATCH REQUEST: BYPASSING DATABASE OPERATIONS ===');
      console.log('=== PATCH REQUEST: RETURNING SUCCESS RESPONSE ===');
      
      return res.status(200).json({
        success: true,
        data: {
          message: 'User updated successfully (DEBUG MODE)',
          updateData: updateData,
          userId: id,
          updatedBy: user?.email
        },
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
      const supabaseAdmin = await getSupabaseAdmin() as unknown as TypedSupabaseClient;
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
            details: process.env.NODE_ENV === 'development' ? (fetchError as { message?: string }).message : null
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

      // Cast userToDelete to proper type
      const typedUserToDelete = userToDelete as {
        id: string;
        email: string;
        name: string;
        role: string;
        status: string;
      };

      // For permanent deletion, prevent deleting the last admin
      if (permanent && typedUserToDelete.role === 'admin') {
        const adminCountResult = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('role', 'admin')
          .eq('status', 'active');
        
        const adminCountData = await adminCountResult as unknown as { data: unknown[]; error: unknown };
        const { data: adminCount, error: adminCountError } = adminCountData;

        if (adminCountError) {
          console.error('Admin count check error:', adminCountError);
          return res.status(500).json({
            success: false,
            error: {
              code: 'ADMIN_COUNT_ERROR',
              message: 'Failed to verify admin count',
              details: process.env.NODE_ENV === 'development' ? (adminCountError as { message?: string }).message : null
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
          const supabaseAuth = await getSupabaseAdmin() as {
            auth: {
              admin: {
                deleteUser: (userId: string) => Promise<{ error: unknown }>;
              };
            };
          };
          const { error: authDeleteError } = await supabaseAuth.auth.admin.deleteUser(id);
          
          if (authDeleteError) {
            console.error('Auth deletion error:', authDeleteError);
            return res.status(500).json({
              success: false,
              error: {
                code: 'AUTH_DELETE_ERROR',
                message: 'Failed to delete user from authentication system',
                details: process.env.NODE_ENV === 'development' ? (authDeleteError as { message?: string }).message : null
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
        const deleteResult = await (supabaseAdmin as unknown as {
          from: (table: string) => {
            delete: () => {
              eq: (column: string, value: string) => Promise<unknown>;
            };
          };
        })
          .from('users')
          .delete()
          .eq('id', id);
        
        const { error: deleteError } = await deleteResult as { error: unknown };

        if (deleteError) {
          console.error('Database deletion error:', deleteError);
          return res.status(500).json({
            success: false,
            error: {
              code: 'DELETE_ERROR',
              message: 'Failed to delete user from database',
              details: process.env.NODE_ENV === 'development' ? (deleteError as { message?: string }).message : null
            },
            timestamp: new Date().toISOString()
          });
        }

        // Log permanent user deletion
        console.info(`User permanently deleted by admin: ${user.email}`, {
          targetUserId: id,
          targetUserEmail: typedUserToDelete.email,
          timestamp: new Date().toISOString()
        });

        return res.status(200).json({
          success: true,
          data: { 
            message: 'User permanently deleted successfully',
            deletedUser: typedUserToDelete
          },
          timestamp: new Date().toISOString()
        });
      } else {
        // Archive user by setting status to 'inactive'
        const { data: archivedUser, error } = await supabaseAdmin
          .from('users')
          .update({ 
            status: 'archived',
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
              details: process.env.NODE_ENV === 'development' ? (error as { message?: string }).message : null
            },
            timestamp: new Date().toISOString()
          });
        }

        // Cast archivedUser to proper type
        const typedArchivedUser = archivedUser as {
          id: string;
          email: string;
          name: string;
          role: string;
          status: string;
          updated_at: string;
        };

        // Log user archiving
        console.info(`User archived by admin: ${user.email}`, {
          targetUserId: id,
          targetUserEmail: typedArchivedUser.email,
          reason: confirmation || 'No reason provided',
          timestamp: new Date().toISOString()
        });

        return res.status(200).json({
          success: true,
          data: { 
            message: 'User archived successfully',
            user: typedArchivedUser
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
      const supabaseAdmin = await getSupabaseAdmin() as unknown as TypedSupabaseClient;
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
            details: process.env.NODE_ENV === 'development' ? (error as { message?: string }).message : null
          },
          timestamp: new Date().toISOString()
        });
      }

      // Cast restoredUser to proper type
      const typedRestoredUser = restoredUser as {
        id: string;
        email: string;
        name: string;
        role: string;
        status: string;
        updated_at: string;
      };

      // Log user restoration
      console.info(`User restored by admin: ${user.email}`, {
        targetUserId: id,
        targetUserEmail: typedRestoredUser.email,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: { 
          message: 'User restored successfully',
          user: typedRestoredUser
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
        const supabaseAdmin = await getSupabaseAdmin() as {
          auth: {
            admin: {
              updateUserById: (userId: string, data: { password: string }) => Promise<{ error: unknown }>;
            };
          };
        };
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
              details: process.env.NODE_ENV === 'development' ? (authError as { message?: string }).message : null
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
    console.error(`User API error:`, error);
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

// Apply Supabase auth and error handler
export default withErrorHandler(handler);
