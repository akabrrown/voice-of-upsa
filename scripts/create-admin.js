// scripts/create-admin.js
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
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
    
    // Check if admin already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Check failed: ${checkError.message}`);
    }
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create admin user
    const { data: result, error: insertError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name: name,
        role: 'admin'
      })
      .select('id, email, name, role')
      .single();
    
    if (insertError) {
      throw new Error(`Insert failed: ${insertError.message}`);
    }
    
    console.log('\n Admin account created successfully!');
    console.log('Details:', result);
    
  } catch (error) {
    console.error('\n Error creating admin:', error.message);
  } finally {
    rl.close();
  }
}

createAdmin();