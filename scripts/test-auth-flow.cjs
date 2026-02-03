const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, anonKey);

async function testCompleteAuthFlow() {
  console.log('=== COMPLETE AUTHENTICATION FLOW TEST ===\n');

  // Step 1: Sign in with Supabase
  console.log('Step 1: Signing in with Supabase...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'akayetb@gmail.com',
    password: 'Option#5'
  });

  if (authError) {
    console.error('❌ Sign-in failed:', authError.message);
    return;
  }

  console.log('✅ Sign-in successful');
  console.log('   User ID:', authData.user.id);
  console.log('   Email:', authData.user.email);
  console.log('   Has session:', !!authData.session);
  console.log('   Access token (first 30 chars):', authData.session?.access_token?.substring(0, 30));

  const accessToken = authData.session.access_token;

  // Step 2: Test CMS user endpoint (simulates middleware /api/auth/cms-user call)
  console.log('\nStep 2: Testing CMS user endpoint...');
  try {
    const cmsRes = await fetch('http://localhost:3000/api/auth/cms-user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Status:', cmsRes.status);
    
    if (cmsRes.ok) {
      const cmsData = await cmsRes.json();
      console.log('✅ CMS user endpoint successful');
      console.log('   Role:', cmsData.user?.role);
      console.log('   Permissions:', cmsData.user?.permissions?.length);
      console.log('   Has manage:users:', cmsData.user?.permissions?.includes('manage:users'));
    } else {
      console.log('❌ CMS user endpoint failed:', cmsRes.status);
      const text = await cmsRes.text();
      console.log('   Response:', text.substring(0, 200));
    }
  } catch (error) {
    console.error('❌ CMS user endpoint error:', error.message);
  }

  // Step 3: Test admin page access (simulating middleware check with cookie)
  console.log('\nStep 3: Testing admin page access with auth-token cookie...');
  try {
    const adminRes = await fetch('http://localhost:3000/admin', {
      headers: {
        'Cookie': `auth-token=${accessToken}`,
        'Accept': 'text/html'
      },
      redirect: 'manual' // Don't follow redirects
    });

    console.log('   Status:', adminRes.status);
    console.log('   Location header:', adminRes.headers.get('location'));
    
    if (adminRes.status === 200) {
      console.log('✅ Admin page accessible (200 OK)');
    } else if (adminRes.status >= 300 && adminRes.status < 400) {
      const redirectTo = adminRes.headers.get('location');
      console.log('⚠️  Redirected to:', redirectTo);
      if (redirectTo?.includes('/auth/sign-in')) {
        console.log('❌ PROBLEM: Middleware is still redirecting to sign-in');
        console.log('   This means the middleware is not recognizing the auth-token cookie');
      }
    } else {
      console.log('❌ Unexpected status:', adminRes.status);
    }
  } catch (error) {
    console.error('❌ Admin page test error:', error.message);
  }

  // Step 4: Check if user profile has correct role
  console.log('\nStep 4: Verifying user profile in database...');
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('id', authData.user.id)
    .single();

  if (userError) {
    console.error('❌ Failed to fetch user profile:', userError.message);
  } else {
    console.log('✅ User profile found');
    console.log('   Role in database:', userData.role);
    if (userData.role === 'admin') {
      console.log('✅ User has admin role');
    } else {
      console.log('⚠️  User role is NOT admin:', userData.role);
    }
  }

  // Step 5: Summary and diagnosis
  console.log('\n=== DIAGNOSIS ===');
  console.log('If the middleware is redirecting to sign-in:');
  console.log('  1. The auth-token cookie must be set by the BROWSER (document.cookie)');
  console.log('  2. This test cannot set browser cookies, it can only test API endpoints');
  console.log('  3. You need to actually sign in through the browser at /auth/sign-in');
  console.log('  4. After signing in, the updated code will set the auth-token cookie');
  console.log('  5. Then you can access /admin pages');
  console.log('\nNext step: Sign in through the browser and check if the cookie is set');
  console.log('You can check cookies in browser DevTools > Application > Cookies');

  console.log('\n=== END TEST ===');
}

testCompleteAuthFlow();
