const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkRLS() {
  console.log('Checking RLS policies for ad_submissions...');
  
  try {
    const { data: policies, error } = await supabase.rpc('get_policies', { table_name: 'ad_submissions' });
    
    if (error) {
      // If RPC doesn't exist, try direct query to pg_policies
      console.log('RPC get_policies failed, trying direct query...');
      const { data: pgPolicies, error: pgError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'ad_submissions');
        
      if (pgError) {
        // Fallback: just try to select as anon and see if it fails
        console.log('Could not fetch policies. Testing access as anon...');
        const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        const { data, error: anonError } = await anonClient
          .from('ad_submissions')
          .select('id')
          .limit(1);
          
        if (anonError) {
          console.error('Anon access failed:', anonError);
        } else {
          console.log('Anon access successful, found data:', data);
        }
      } else {
        console.log('Polices found:', pgPolicies);
      }
    } else {
      console.log('Policies found via RPC:', policies);
    }
  } catch (err) {
    console.error('Unexpected error checking RLS:', err);
  }
}

checkRLS();
