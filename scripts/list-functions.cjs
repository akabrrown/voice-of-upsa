const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listFunctions() {
  console.log('Listing functions via information_schema.routines...')
  try {
    const { data, error } = await supabase
      .from('routines')
      .select('routine_name, routine_type')
      .eq('routine_schema', 'public')

    if (error) {
      console.error('Failed to list routines via PostgREST (expected if not exposed):', error)
      
      // Try querying pg_proc if possible
      console.log('\nTrying to query pg_proc via Rest API...')
      const { data: procData, error: procError } = await supabase
        .from('pg_proc')
        .select('proname')
        .limit(20)
      
      if (procError) {
         console.error('Failed to query pg_proc:', procError)
      } else {
         console.log('Found procs:', procData)
      }
    } else {
      console.log('Found routines:', data)
    }
  } catch (err) {
    console.error('Unexpected error:', err.message)
  }
}

listFunctions()
