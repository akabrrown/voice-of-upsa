const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const email = 'akayetb@gmail.com';
const id = '34e22590-8a37-4d29-9267-7932836f4a1e';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugAuthCreation() {
  console.log('=== Debugging Auth Creation Error ===');
  try {
    // 1. Check if user still exists in auth.users by any chance
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    const existing = users.find(u => u.email === email || u.id === id);
    if (existing) {
      console.log('User still exists in Auth:', existing.id, existing.email);
      // Wait, if it exists, maybe we should skip creation? 
      // But we just deleted it in the previous step.
    }

    // 2. Try creation again and catch full error object
    console.log('Attempting createUser with ID:', id);
    const result = await supabase.auth.admin.createUser({
      id: id,
      email: email,
      password: 'TemporaryPassword123!',
      email_confirm: true,
      user_metadata: { full_name: 'akayete benedict', migrated: true }
    });

    if (result.error) {
      console.log('Error Code:', result.error.code);
      console.log('Error Message:', result.error.message);
      console.log('Full Error:', JSON.stringify(result.error, null, 2));
    } else {
      console.log('Success!');
    }
  } catch (e) {
    console.error('Exception:', e);
  }
}

debugAuthCreation();
