const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase keys.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserRole() {
  const email = 'akayetb@gmail.com';
  console.log(`Checking roles for ${email}...`);

  // 1. Get user from Auth (metadata)
  // We can't query auth.users directly via client usually, but listUsers via admin API works if enabled
  // Or just try to getUser by email if we had that, but let's use listUsers
  
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.log('Error listing auth users:', authError.message);
    return;
  }

  const authUser = users.find(u => u.email === email);
  
  if (!authUser) {
    console.log('User not found in Auth!');
  } else {
    console.log('AUTH METADATA Role:', authUser.user_metadata?.role);
    console.log('AUTH ID:', authUser.id);
    
    // 2. Get user from public.users
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (publicError) {
      console.log('Error fetching public user:', publicError.message);
    } else {
      console.log('PUBLIC TABLE Role:', publicUser?.role);
      
      if (authUser.user_metadata?.role !== publicUser?.role) {
        console.log('MISMATCH DETECTED! This explains why buttons disappeared.');
      } else {
        console.log('Roles match.');
      }
    }
  }
}

checkUserRole();
