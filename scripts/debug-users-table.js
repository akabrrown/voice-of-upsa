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

async function debugUsersTable() {
  try {
    console.log('=== DEBUGGING USERS TABLE ===');
    
    // Check if users table exists and get structure
    console.log('\n1. Checking users table structure...');
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.error('Users table error:', tableError);
        return;
      }
      
      console.log('Users table exists and is accessible');
      console.log('Sample columns:', Object.keys(tableInfo[0] || {}));
    } catch (error) {
      console.error('Error accessing users table:', error);
      return;
    }
    
    // Check total count of users
    console.log('\n2. Checking total users count...');
    try {
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Count error:', countError);
      } else {
        console.log(`Total users in table: ${count}`);
      }
    } catch (error) {
      console.error('Error counting users:', error);
    }
    
    // Get all users data
    console.log('\n3. Getting all users data...');
    try {
      const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        console.error('Fetch users error:', fetchError);
        return;
      }
      
      console.log(`Found ${users.length} users:`);
      users.forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`);
        console.log(`  ID: ${user.id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Name: ${user.name || 'NULL'}`);
        console.log(`  Role: ${user.role || 'NULL'}`);
        console.log(`  Is Active: ${user.is_active}`);
        console.log(`  Created: ${user.created_at}`);
        console.log(`  Updated: ${user.updated_at}`);
      });
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    
    // Check auth.users for comparison
    console.log('\n4. Checking auth.users for comparison...');
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Auth users error:', authError);
      } else {
        console.log(`Found ${authUsers.users.length} auth users:`);
        authUsers.users.forEach((user, index) => {
          console.log(`\nAuth User ${index + 1}:`);
          console.log(`  ID: ${user.id}`);
          console.log(`  Email: ${user.email}`);
          console.log(`  Role: ${user.user_metadata?.role || 'NULL'}`);
          console.log(`  Created: ${user.created_at}`);
        });
      }
    } catch (error) {
      console.error('Error fetching auth users:', error);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugUsersTable();
