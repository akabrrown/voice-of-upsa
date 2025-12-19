import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdmin } from '@/lib/database-server';

/**
 * API endpoint to sync the current authenticated user to the users table
 * and optionally set them as admin (for initial setup only).
 * 
 * This endpoint should be secured or removed after initial setup.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST method is allowed' }
    });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }

    const token = authHeader.substring(7);
    
    // Get Supabase admin client
    const supabaseAdmin = await getSupabaseAdmin();
    if (!supabaseAdmin) {
      throw new Error('Database connection failed');
    }

    // Verify the Supabase token
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authUser) {
      console.error('Sync user API - Token validation error:', authError);
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid token' }
      });
    }

    console.log('Sync user API - Authenticated user:', authUser.email);

    // Get role from request body (default to 'admin' for initial setup)
    const { role = 'admin' } = req.body;

    // Check if user already exists in users table
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Sync user API - Error checking existing user:', fetchError);
    }

    if (existingUser) {
      // Update existing user's role
      console.log('Sync user API - Updating existing user role to:', role);
      
      const { data: updatedUser, error: updateError } = await (supabaseAdmin as unknown as { 
        from: (table: string) => { 
          update: (data: { role: string; updated_at: string }) => { 
            eq: (column: string, value: string) => { 
              select: () => { 
                single: () => Promise<{ data: { id: string; email: string; role: string } | null; error: { message: string } | null }> 
              } 
            } 
          } 
        } 
      })
        .from('users')
        .update({ 
          role: role,
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser.id)
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
      
      if (!authUser.email) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'INVALID_USER', 
            message: 'User email is required' 
          }
        });
      }
      
      const { data: newUser, error: insertError } = await (supabaseAdmin as unknown as { 
        from: (table: string) => { 
          insert: (data: { id: string; email: string; name: string; role: string; created_at: string; updated_at: string }) => { 
            select: () => { 
              single: () => Promise<{ data: { id: string; email: string; role: string } | null; error: { message: string } | null }> 
            } 
          } 
        } 
      })
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
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

export default handler;
