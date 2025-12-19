const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function grantPermissions() {
  console.log('Granting permissions to service role...')
  
  try {
    // Grant all permissions to service role
    console.log('Granting ALL privileges on user_profiles to service role...')
    
    // First try to grant permissions directly
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;'
    })
    
    if (error) {
      console.log('Direct grant failed, trying alternative approach...')
      
      // Try using raw SQL through the REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          sql: 'GRANT ALL ON user_profiles TO authenticated; GRANT ALL ON user_profiles TO service_role;'
        })
      })
      
      if (!response.ok) {
        console.error('Failed to grant permissions via REST API:', await response.text())
      } else {
        console.log('Permissions granted via REST API')
      }
    } else {
      console.log('Permissions granted successfully')
    }
    
    // Test the connection again
    console.log('\n=== Testing Access After Grant ===')
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('Still getting error:', testError)
    } else {
      console.log('SUCCESS: Admin access working, found', testData.length, 'profiles')
    }
    
  } catch (error) {
    console.error('Error granting permissions:', error)
  }
}

grantPermissions()
