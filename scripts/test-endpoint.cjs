const { createClient } = require('@supabase/supabase-js');
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, anonKey);

async function testEndpoint() {
  // Sign in first
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'akayetb@gmail.com',
    password: 'Option#5'
  });

  const token = authData.session.access_token;

  // Test the endpoint with detailed output
  console.log('Testing /api/admin/notifications/stats...\n');

  const res = await fetch('http://localhost:3000/api/admin/notifications/stats', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  console.log('Status:', res.status);
  console.log('Status Text:', res.statusText);
  console.log('Content-Type:', res.headers.get('content-type'));
  console.log('Headers:', Object.fromEntries(res.headers.entries()));
  
  const text = await res.text();
  console.log('\nResponse Body (first 500 chars):');
  console.log(text.substring(0, 500));

  // Check if it's JSON
  try {
    const json = JSON.parse(text);
   console.log('\n✅ Response is valid JSON:');
    console.log(JSON.stringify(json, null, 2));
  } catch (e) {
    console.log('\n❌ Response is NOT valid JSON');
    console.log('   Error:', e.message);
  }
}

testEndpoint();
