import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env file
config({ path: '.env.local' });

// Create Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function syncUserRole() {
  try {
    console.log('=== SYNCING USER ROLE ===');
    
    // Get user from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }
    
    const user = authUsers.users.find(u => u.email === 'akayetb@gmail.com');
    
    if (!user) {
      console.error('User not found in auth.users');
      return;
    }
    
    console.log('Auth user role:', user.user_metadata?.role);
    
    // Update users table to match auth metadata
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ role: user.user_metadata?.role || 'user' })
      .eq('id', user.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating user role in users table:', updateError);
      return;
    }
    
    console.log('Successfully updated user role in users table:');
    console.log(`  ID: ${updateData.id}`);
    console.log(`  Email: ${updateData.email}`);
    console.log(`  New Role: ${updateData.role}`);
    
  } catch (error) {
    console.error('Sync error:', error);
  }
}

syncUserRole();
