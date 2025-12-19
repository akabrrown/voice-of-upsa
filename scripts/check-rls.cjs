const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRLS() {
  console.log('Checking RLS policies for user_profiles table...')
  
  try {
    // Check if RLS is enabled
    console.log('\n=== Checking RLS Status ===')
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_tables')
      .select('rowsecurity')
      .eq('tablename', 'user_profiles')
      .eq('schemaname', 'public')
      .single()
    
    if (rlsError) {
      console.log('Could not check RLS status via pg_tables, trying direct SQL...')
    } else {
      console.log('RLS enabled:', rlsStatus.rowsecurity)
    }
    
    // Check existing policies
    console.log('\n=== Checking Policies ===')
    const { data: policies, error: policyError } = await supabase
      .rpc('get_policies_for_table', { table_name: 'user_profiles' })
    
    if (policyError) {
      console.log('Could not fetch policies via RPC, trying direct query...')
      
      // Try direct SQL query
      const { data: directPolicies, error: directError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'user_profiles')
        .eq('schemaname', 'public')
      
      if (directError) {
        console.error('Error checking policies:', directError)
      } else {
        console.log('Found policies:', directPolicies)
      }
    } else {
      console.log('Found policies:', policies)
    }
    
    // Check table permissions
    console.log('\n=== Checking Permissions ===')
    const { data: permissions, error: permError } = await supabase
      .from('information_schema.role_table_grants')
      .select('*')
      .eq('table_name', 'user_profiles')
      .eq('table_schema', 'public')
    
    if (permError) {
      console.error('Error checking permissions:', permError)
    } else {
      console.log('Table permissions:', permissions)
    }
    
    // Test with a simple query using admin client
    console.log('\n=== Testing Admin Access ===')
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('Admin query failed:', testError)
    } else {
      console.log('Admin query successful, found', testData.length, 'profiles')
    }
    
  } catch (error) {
    console.error('Error checking RLS:', error)
  }
}

checkRLS()
