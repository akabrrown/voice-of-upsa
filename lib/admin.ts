import { supabaseAdmin } from './database-server';

export async function checkIfAdminExists(): Promise<boolean> {
  if (!supabaseAdmin) {
    console.error('Supabase admin client not initialized');
    return false;
  }
  
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (error) {
      console.error('Error checking admin existence:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking admin existence:', error);
    return false;
  }
}

export async function createAdmin(adminData: {
  email: string;
  name: string;
  password?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) {
    return { success: false, error: 'Supabase admin client not initialized' };
  }
  
  try {
    // Check if admin already exists
    const adminExists = await checkIfAdminExists();
    if (adminExists) {
      return { success: false, error: 'Admin user already exists' };
    }

    // Create user in Supabase Auth
    let userId: string;
    
    if (adminData.password) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: adminData.email,
        password: adminData.password,
        email_confirm: true,
        user_metadata: {
          name: adminData.name,
          role: 'admin'
        }
      });

      if (authError || !authData.user) {
        return { success: false, error: authError?.message || 'Failed to create admin user' };
      }

      userId = authData.user.id;
    } else {
      // If no password provided, we need to create the user through a different method
      // This would typically be done through an invitation flow
      return { success: false, error: 'Password is required for admin creation' };
    }

    // Create user record in database
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: adminData.email,
        name: adminData.name,
        role: 'admin',
        status: 'active'
      });

    if (dbError) {
      // Rollback auth user creation if database insert fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { success: false, error: dbError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating admin:', error);
    return { success: false, error: 'Failed to create admin user' };
  }
}

export async function validateAdminSetupToken(token: string): Promise<boolean> {
  if (!supabaseAdmin) {
    console.error('Supabase admin client not initialized');
    return false;
  }
  
  // This would validate a special setup token for initial admin creation
  // For now, we'll use a simple approach with environment variables
  const setupToken = process.env.ADMIN_SETUP_TOKEN;
  
  if (!setupToken) {
    return false;
  }

  return token === setupToken;
}

export async function getAdminUsers(): Promise<Array<{
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_sign_in?: string;
}>> {
  if (!supabaseAdmin) {
    console.error('Supabase admin client not initialized');
    return [];
  }
  
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, created_at, last_sign_in')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin users:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }
}