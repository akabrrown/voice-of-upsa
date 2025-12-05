import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { authenticate, checkRole } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/auth';
import { z } from 'zod';

// Validation schema
const createRoleSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(255, 'Name must not exceed 255 characters'),
  role: z.enum(['user', 'editor', 'admin'])
});

// Rate limiting: 5 role creations per minute per admin
const rateLimitMiddleware = withRateLimit(5, 60 * 1000, (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  return token || req.socket.remoteAddress || 'unknown';
});

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
    // Apply rate limiting
    rateLimitMiddleware(req);

    // Authenticate user
    const user = await authenticate(req);

    // Authorize admin access
    if (!checkRole(user.role, ['admin'])) {
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
    
    // Validate request body
    const validatedData = createRoleSchema.parse(req.body);
    const { email, name, role } = validatedData;

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing user:', checkError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'USER_CHECK_FAILED',
          message: 'Failed to check if user exists',
          details: checkError.message
        },
        timestamp: new Date().toISOString()
      });
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: 'A user with this email already exists',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Generate a temporary password for the new user
    const tempPassword = Array.from({ length: 12 }, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
      .charAt(Math.floor(Math.random() * 62))
    ).join('');

    // Create user in Supabase Auth first
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm so they can use temp password
      user_metadata: {
        name,
        role
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_USER_CREATION_FAILED',
          message: 'Failed to create user in authentication system',
          details: authError.message
        },
        timestamp: new Date().toISOString()
      });
    }

    if (!authUser.user) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_USER_CREATION_FAILED',
          message: 'No auth user was created',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    console.log('Created auth user:', { 
      id: authUser.user.id, 
      email: authUser.user.email, 
      confirmed: authUser.user.email_confirmed_at 
    });

    // Create new user with role in users table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newUser, error: createError } = await (supabaseAdmin as any)
      .from('users')
      .insert({
        id: authUser.user.id, // Use the same ID as auth user
        email,
        name,
        role,
        email_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user record:', createError);
      // Clean up auth user if database record creation failed
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      
      return res.status(500).json({
        success: false,
        error: {
          code: 'USER_CREATION_FAILED',
          message: 'Failed to create user record',
          details: createError.message
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log the role creation
    console.info(`User role created by admin ${user.id}:`, {
      createdUserId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      temporaryPassword: '***' // Don't log actual password
    });

    return res.status(201).json({
      success: true,
      data: {
        user: newUser,
        tempPassword, // Include temporary password for admin to share
        instructions: 'Share this temporary password with the user or use invitation link'
      },
      message: 'User created successfully with temporary password',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create role API error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while creating user role',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : null
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default withErrorHandler(handler);

