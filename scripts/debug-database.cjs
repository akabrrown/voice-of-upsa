const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugDatabase() {
  console.log('Debugging database access issues...')
  
  try {
    // Test basic connection
    console.log('\n=== Testing Basic Connection ===')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_profiles')
      .single()
    
    if (connectionError) {
      console.log('Cannot access information_schema, trying alternative...')
    } else {
      console.log('Table exists in information_schema:', connectionTest)
    }
    
    // Try to list all tables we can access
    console.log('\n=== Testing What Tables We Can Access ===')
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename, schemaname, rowsecurity')
      .eq('schemaname', 'public')
      .limit(10)
    
    if (tablesError) {
      console.error('Cannot access pg_tables:', tablesError.message)
    } else {
      console.log('Accessible tables:', tables)
    }
    
    // Try to access user_profiles with different methods
    console.log('\n=== Testing user_profiles Access Methods ===')
    
    // Method 1: Direct select
    console.log('Method 1: Direct select')
    try {
      const { data: method1, error: error1 } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1)
      console.log('Method 1 result:', error1 || 'Success')
    } catch (e) {
      console.log('Method 1 exception:', e.message)
    }
    
    // Method 2: Count
    console.log('Method 2: Count')
    try {
      const { data: method2, error: error2 } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
      console.log('Method 2 result:', error2 || 'Success')
    } catch (e) {
      console.log('Method 2 exception:', e.message)
    }
    
    // Method 3: Using RPC to check table
    console.log('Method 3: RPC check')
    try {
      const { data: method3, error: error3 } = await supabase
        .rpc('check_table_exists', { table_name: 'user_profiles' })
      console.log('Method 3 result:', error3 || 'Success')
    } catch (e) {
      console.log('Method 3 exception:', e.message)
    }
    
    // Check if we can create a simple test table
    console.log('\n=== Testing Table Creation ===')
    try {
      const { data: createTest, error: createError } = await supabase
        .from('test_table')
        .select('*')
        .limit(1)
      
      if (createError && createError.code === 'PGRST205') {
        console.log('Test table does not exist (expected)')
        
        // Try to create it
        console.log('Creating test_table...')
        // This will likely fail but let's see the error
      } else {
        console.log('Unexpected result for test_table:', createTest)
      }
    } catch (e) {
      console.log('Test table check exception:', e.message)
    }
    
  } catch (error) {
    console.error('Debug error:', error)
  }
}

debugDatabase()
