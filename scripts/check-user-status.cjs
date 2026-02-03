const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const email = 'akayetb@gmail.com';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('=== YOUR ACCOUNT STATUS ===');
  console.log('Email Checked:', email);
  try {
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;
    const authUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    console.log('Found in Supabase Auth (auth.users):', authUser ? 'YES ✓' : 'NO ✗');
    if (authUser) {
        console.log(' Auth ID:', authUser.id);
    }
    
    const { data: publicUsers, error: publicError } = await supabase.from('users').select('*').ilike('email', email);
    if (publicError) throw publicError;
    console.log('Found in Public Database (public.users):', publicUsers && publicUsers.length > 0 ? 'YES ✓ (' + publicUsers.length + ' records)' : 'NO ✗');
    if (publicUsers) {
      publicUsers.forEach((r, i) => console.log(` Record ${i+1}: ID=${r.id}, Created=${r.created_at}, Role=${r.role}`));
    }

    console.log('\n--- Testing Custom ID Support ---');
    const dummyId = '00000000-0000-0000-0000-000000000001';
    const testEmail = 'test-' + Date.now() + '@example.com';
    const { data: testData, error: testError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'Password123!',
      id: dummyId
    });

    if (testError) {
      console.log('Custom ID Result: FAIL -', testError.message);
    } else {
      console.log('Custom ID Result: SUCCESS ✓ (Created ID:', testData.user.id + ')');
      await supabase.auth.admin.deleteUser(testData.user.id);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}
run();
