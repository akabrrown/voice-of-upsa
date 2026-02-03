const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, anonKey);

async function testAdminAuth() {
  console.log('=== ADMIN AUTHENTICATION TEST ===\n');

  // 1. Sign in as admin
  console.log('1. Signing in as admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'akayetb@gmail.com',
    password: 'Option#5'
  });

  if (authError) {
    console.error('❌ Sign in failed:', authError.message);
    return;
  }

  console.log('✅ Sign in successful');
  console.log('   User ID:', authData.user.id);
  console.log('   Email:', authData.user.email);
  
  // 2. Check user profile in public.users
  console.log('\n2. Checking user profile...');
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, role, full_name')
    .eq('id', authData.user.id)
    .single();

  if (userError) {
    console.error('❌ Failed to fetch user profile:', userError.message);
  } else {
    console.log('✅ User profile found:');
    console.log('   Full Name:', userData.full_name);
    console.log('   Role:', userData.role);
    console.log('   Expected: admin');
    
    if (userData.role !== 'admin') {
      console.log('⚠️  WARNING: User role is not "admin"!');
    }
  }

  // 3. Test the notifications API endpoint
  console.log('\n3. Testing notifications API endpoint...');
  const accessToken = authData.session.access_token;
  
  try {
    const res = await fetch('http://localhost:3000/api/admin/notifications/stats', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Response status:', res.status);
    console.log('   Response content-type:', res.headers.get('content-type'));

    if (res.ok) {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        console.log('✅ Notifications API successful:');
        console.log('   Data:', JSON.stringify(data, null, 2));
      } else {
        const text = await res.text();
        console.log('⚠️  Response is not JSON (got HTML/redirect):');
        console.log('   First 200 chars:', text.substring(0, 200));
      }
    } else {
      const text = await res.text();
      console.log('❌ API returned error:', res.status);
      console.log('   Response:', text.substring(0, 500));
    }
  } catch (error) {
    console.error('❌ Fetch error:', error.message);
  }

  // 4. Test CMS user API
  console.log('\n4. Testing CMS user API endpoint...');
  try {
    const res = await fetch('http://localhost:3000/api/auth/cms-user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Response status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ CMS User API successful:');
      console.log('   Data:', JSON.stringify(data, null, 2));
    } else {
      const text = await res.text();
      console.log('❌ API returned error:', res.status);
      console.log('   Response:', text.substring(0, 500));
    }
  } catch (error) {
    console.error('❌ Fetch error:', error.message);
  }

  console.log('\n=== END TEST ===');
}

testAdminAuth();
