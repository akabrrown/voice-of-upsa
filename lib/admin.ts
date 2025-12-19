import { supabaseAdmin } from './database-server';

// Define specific types for better type safety
interface SupabaseQueryResult<T = unknown> {
  data: T;
  error: SupabaseError | null;
}

interface SupabaseError {
  message: string;
  code?: string;
  details?: unknown;
}

interface SupabaseUser {
  id: string;
  email?: string;
}

interface AuthResponse {
  data: { user: SupabaseUser };
  error: SupabaseError | null;
}

interface UserRecord {
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_sign_in?: string;
}

// Define a simple type for Supabase operations to avoid complex type constraints
type TypedSupabaseClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string | number) => {
        limit: (limit: number) => Promise<SupabaseQueryResult<UserRecord[]>>;
        order: (column: string, options: { ascending: boolean }) => Promise<SupabaseQueryResult<UserRecord[]>>;
      };
      insert: (data: Record<string, unknown>) => Promise<SupabaseQueryResult<null>>;
    };
    insert: (data: Record<string, unknown>) => Promise<SupabaseQueryResult<null>>;
  };
  auth: {
    admin: {
      createUser: (userData: Record<string, unknown>) => Promise<AuthResponse>;
      deleteUser: (userId: string) => Promise<SupabaseQueryResult<null>>;
    };
  };
};

export async function checkIfAdminExists(): Promise<boolean> {
  if (!supabaseAdmin) {
    console.error('Supabase admin client not initialized');
    return false;
  }
  
  try {
    const { data, error } = await (supabaseAdmin as unknown as TypedSupabaseClient)
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
      const { data: authData, error: authError } = await (supabaseAdmin as unknown as TypedSupabaseClient).auth.admin.createUser({
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
    const { error: dbError } = await (supabaseAdmin as unknown as TypedSupabaseClient)
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
      await (supabaseAdmin as unknown as TypedSupabaseClient).auth.admin.deleteUser(userId);
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
    const { data, error } = await (supabaseAdmin as unknown as TypedSupabaseClient)
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