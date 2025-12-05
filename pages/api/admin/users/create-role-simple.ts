import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/database-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('=== SIMPLE CREATE ROLE API ===');
    
    // Only allow POST
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

    const { email, name, role } = req.body;
    
    console.log('Request data:', { email, name, role });
    
    // Basic validation
    if (!email || !name || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, name, role'
      });
    }

    if (!['user', 'editor', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be: user, editor, or admin'
      });
    }

    // Check if user already exists
    console.log('Checking if user exists...');
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing user:', checkError);
      return res.status(500).json({
        success: false,
        error: 'Failed to check if user exists',
        details: checkError.message
      });
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create user in Supabase Auth first
    console.log('Creating user in Supabase Auth...');
    // Generate a temporary password
    const tempPassword = Array.from({ length: 12 }, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
      .charAt(Math.floor(Math.random() * 62))
    ).join('');

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name, role }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create user in authentication system',
        details: authError.message
      });
    }

    if (!authUser.user) {
      return res.status(500).json({
        success: false,
        error: 'No auth user was created'
      });
    }

    // Create new user in public table
    console.log('Creating new user in public table...');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newUser, error: createError } = await (supabaseAdmin as any)
      .from('users')
      .insert({
        id: authUser.user.id, // Use the Auth user ID
        email,
        name,
        role,
        email_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    // If DB insert fails, cleanup the auth user
    if (createError) {
      console.error('Error creating user record, cleaning up auth user...');
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    }

    if (createError) {
      console.error('Error creating user:', createError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create user',
        details: createError.message
      });
    }

    console.log('User created successfully:', newUser);

    return res.status(201).json({
      success: true,
      data: {
        user: newUser
      },
      message: 'User role created successfully'
    });

  } catch (error) {
    console.error('Create role API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

