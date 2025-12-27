const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function diagnostic() {
  console.log('=== DATABASE RLS DIAGNOSTIC ===')
  
  try {
    // 1. Check RLS status on all public tables
    console.log('\n--- RLS Status on Tables ---')
    const { data: tables, error: tablesError } = await supabase.rpc('exec', { 
      sql: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    })
    
    if (tablesError) {
      console.error('Error fetching table status:', tablesError)
    } else {
      console.table(tables)
    }
    
    // 2. Check policies on users and settings
    console.log('\n--- Policies on Sensitive Tables ---')
    const { data: policies, error: policiesError } = await supabase.rpc('exec', { 
      sql: `SELECT tablename, policyname, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('users', 'settings')`
    })
    
    if (policiesError) {
      console.error('Error fetching policies:', policiesError)
    } else {
      console.table(policies)
    }
    
    // 3. Check if anon has direct grants
    console.log('\n--- Direct SELECT Grants for anon role ---')
    const { data: grants, error: grantsError } = await supabase.rpc('exec', { 
      sql: `SELECT table_name, privilege_type FROM information_schema.role_table_grants WHERE grantee = 'anon' AND table_schema = 'public' AND table_name IN ('users', 'settings')`
    })
    
    if (grantsError) {
      console.error('Error fetching grants:', grantsError)
    } else {
      console.table(grants)
    }

  } catch (error) {
    console.error('Diagnostic failed:', error)
  }
}

diagnostic()
