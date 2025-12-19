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

async function testAdminUsersAPI() {
  try {
    console.log('=== TESTING ADMIN USERS API ===');
    
    // Test the same query that the admin users API uses
    console.log('\n1. Testing users table query...');
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .range(0, 19); // First 20 users
    
    if (fetchError) {
      console.error('Query error:', fetchError);
      return;
    }
    
    console.log(`Query returned ${users.length} users`);
    
    if (users.length > 0) {
      console.log('First user details:');
      console.log(`  ID: ${users[0].id}`);
      console.log(`  Email: ${users[0].email}`);
      console.log(`  Name: ${users[0].name}`);
      console.log(`  Role: ${users[0].role}`);
      console.log(`  Is Active: ${users[0].is_active}`);
      console.log(`  Created: ${users[0].created_at}`);
    }
    
    // Test with role filter
    console.log('\n2. Testing with role filter (all)...');
    const { data: allUsers, error: allError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'all') // This should return no results since 'all' is not a valid role
      .order('created_at', { ascending: false })
      .range(0, 19);
    
    if (allError) {
      console.error('Role filter error:', allError);
    } else {
      console.log(`Role filter 'all' returned ${allUsers.length} users`);
    }
    
    // Test with admin role filter
    console.log('\n3. Testing with role filter (admin)...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .order('created_at', { ascending: false })
      .range(0, 19);
    
    if (adminError) {
      console.error('Admin role filter error:', adminError);
    } else {
      console.log(`Admin role filter returned ${adminUsers.length} users`);
      if (adminUsers.length > 0) {
        console.log('Admin user:', adminUsers[0].email);
      }
    }
    
    // Test with editor role filter
    console.log('\n4. Testing with role filter (editor)...');
    const { data: editorUsers, error: editorError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'editor')
      .order('created_at', { ascending: false })
      .range(0, 19);
    
    if (editorError) {
      console.error('Editor role filter error:', editorError);
    } else {
      console.log(`Editor role filter returned ${editorUsers.length} users`);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testAdminUsersAPI();
