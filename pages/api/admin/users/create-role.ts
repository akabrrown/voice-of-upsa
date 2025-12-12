import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withCMSSecurity } from '@/lib/security/cms-security';
import { z } from 'zod';

// Enhanced validation schema for role creation
const createRoleSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  name: z.string().min(1, 'Name is required').max(255, 'Name must not exceed 255 characters'),
  role: z.enum(['user', 'editor', 'admin'])
});

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string; securityLevel?: string }) {
  try {
    // Only allow POST for role creation
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only POST method is allowed for role creation',
          details: null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate input with enhanced schema
    const validatedData = createRoleSchema.parse(req.body);
    const { email, name, role } = validatedData;

    // Log admin role creation action
    console.log(`Admin role creation initiated`, {
      adminId: user.id,
      adminEmail: user.email,
      targetEmail: email,
      targetName: name,
      targetRole: role,
      timestamp: new Date().toISOString()
    });

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role')
      .eq('email', email)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Admin create role check error:', checkError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'USER_CHECK_FAILED',
          message: 'Failed to check if user exists',
          details: process.env.NODE_ENV === 'development' ? checkError.message : null
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
          details: 'Use the invite endpoint to assign roles to existing users'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Generate secure temporary password
    const tempPassword = Array.from({ length: 16 }, () => 
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
        role,
        created_by: user.id
      }
    });

    if (authError) {
      console.error('Admin create role auth error:', authError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_USER_CREATION_FAILED',
          message: 'Failed to create user in authentication system',
          details: process.env.NODE_ENV === 'development' ? authError.message : null
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

    // Create new user with role in users table
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id, // Use the same ID as auth user
        email,
        name,
        role,
        email_verified: false,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, email, name, role, created_at')
      .single();

    if (createError) {
      console.error('Admin create role database error:', createError);
      // Clean up auth user if database record creation failed
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      
      return res.status(500).json({
        success: false,
        error: {
          code: 'USER_CREATION_FAILED',
          message: 'Failed to create user record',
          details: process.env.NODE_ENV === 'development' ? createError.message : null
        },
        timestamp: new Date().toISOString()
      });
    }

    // Log successful role creation
    console.log(`Admin user role created successfully`, {
      adminId: user.id,
      createdUserId: newUser.id,
      createdEmail: newUser.email,
      createdName: newUser.name,
      createdRole: newUser.role,
      timestamp: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully with temporary password',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          created_at: newUser.created_at
        },
        tempPassword, // Include temporary password for admin to share
        created_by: user.id,
        instructions: 'Share this temporary password with the user or use invitation link'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin create role API error:', error);
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

// Apply CMS security middleware and enhanced error handler
export default withErrorHandler(withCMSSecurity(handler));

