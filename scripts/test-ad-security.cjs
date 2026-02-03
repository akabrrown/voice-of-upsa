const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Use anon client to simulate a malicious user
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSelfApproval() {
  console.log('--- Testing Ad Self-Approval Vulnerability ---');
  
  const maliciousAd = {
    first_name: 'Malicious',
    last_name: 'User',
    email: 'malicious@example.com',
    phone: '0000000000',
    business_type: 'individual',
    ad_type: 'banner',
    ad_title: 'Hacked Ad',
    ad_description: 'I should not be able to publish this myself.',
    target_audience: 'Everyone',
    budget: 'GHS 1',
    duration: '1-week',
    start_date: new Date().toISOString().split('T')[0],
    terms_accepted: true,
    status: 'published' // ATTEMPT TO SELF-APPROVE
  };

  console.log('Attempting to insert an ad with status="published"...');
  
  const { data, error } = await supabase
    .from('ad_submissions')
    .insert([maliciousAd])
    .select();

  if (error) {
    if (error.code === '42501' || error.message.includes('new row violates row-level security policy')) {
      console.log('✅ SUCCESS: RLS blocked the self-approval attempt.');
    } else {
      console.log('❌ FAILED: Unexpected error:', error);
    }
  } else {
    console.log('❌ FAILED: Ad was inserted successfully as published!');
    console.log('Inserted Data:', data);
    
    // Clean up if it succeeded (which it shouldn't)
    // We can't delete via anon client if RLS is proper, but we'll try or just note it.
  }
}

testSelfApproval();
