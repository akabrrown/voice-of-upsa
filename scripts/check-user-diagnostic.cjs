const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const emailToCheck = 'akayetb@gmail.com';

async function checkUser() {
  console.log(`Checking for user: ${emailToCheck}`);

  // 1. Check auth.users via admin API
  console.log('\n--- Checking auth.users via admin.listUsers() ---');
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error listing users:', authError.message);
  } else {
    const foundInAuthList = users.find(u => u.email === emailToCheck);
    console.log('Found in auth.users list:', foundInAuthList ? 'YES' : 'NO');
    if (foundInAuthList) {
      console.log('User ID in Auth:', foundInAuthList.id);
    }
    console.log('Total users in auth list returned:', users.length);
  }

  // 2. Check auth.users via getUserByEmail
  console.log('\n--- Checking auth.users via getUserByEmail ---');
  // Note: getUserByEmail is often what we should use
  // However, there is no direct getUserByEmail in the admin API for some versions of supabase-js
  // Let's try listing with filter or just checking if we can find it in the public.users
  
  // 3. Check public.users
  console.log('\n--- Checking public.users table ---');
  const { data: publicUser, error: publicError } = await supabase
    .from('users')
    .select('*')
    .eq('email', emailToCheck)
    .maybeSingle();

  // 4. Check auth.users via getUserById
  if (publicUser) {
    console.log('\n--- Checking auth.users via admin.getUserById() ---');
    const { data: { user: authUser }, error: authIdError } = await supabase.auth.admin.getUserById(publicUser.id);
    
    if (authIdError) {
      console.error('Error fetching user by ID from auth:', authIdError.message);
    } else {
      console.log('Found in auth.users by ID:', authUser ? 'YES' : 'NO');
      if (authUser) {
        console.log('Auth User Email:', authUser.email);
        console.log('Auth User ID:', authUser.id);
      }
    }
  }
}

checkUser();
