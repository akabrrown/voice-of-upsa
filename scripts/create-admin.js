// scripts/create-admin.js
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

dotenv.config({ path: '.env.local' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdmin() {
  try {
    console.log('=== Create Admin Account ===\n');
    
    // Get admin details
    const name = await question('Enter admin name: ');
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password (min 8 chars): ');
    
    // Validate inputs
    if (!name || name.length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email address');
    }
    
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    
    // Check if admin already exists in Auth
    console.log('\nChecking if user already exists...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to check existing users: ${listError.message}`);
    }
    
    const existingAuthUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (existingAuthUser) {
      throw new Error('User with this email already exists in Auth');
    }
    
    // Create admin user in Supabase Auth (this will auto-create profile via trigger)
    console.log('Creating admin account in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true, // Auto-confirm admin accounts
      user_metadata: {
        full_name: name
      }
    });
    
    if (authError) {
      throw new Error(`Auth account creation failed: ${authError.message}`);
    }
    
    console.log('Auth account created successfully!');
    
    // Update the profile to set admin role
    // The handle_new_user trigger already created the profile, we just need to update the role
    console.log('Setting admin role...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        role: 'admin',
        name: name
      })
      .eq('id', authData.user.id);
    
    if (updateError) {
      console.warn('Warning: Failed to set admin role:', updateError.message);
      console.warn('You may need to manually update the role in the database');
    }
    
    console.log('\n✅ Admin account created successfully!');
    console.log('Details:');
    console.log('  Email:', email);
    console.log('  Name:', name);
    console.log('  Role: admin');
    console.log('  ID:', authData.user.id);
    console.log('\nThe admin can now sign in with the provided password.');
    
  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
  } finally {
    rl.close();
  }
}

createAdmin();
