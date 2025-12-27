const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testExecSql() {
  console.log('Testing exec_sql RPC...')
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'SELECT 1 as test'
    })

    if (error) {
      console.error('exec_sql failed:', error)
    } else {
      console.log('exec_sql succeeded:', data)
    }

    console.log('\nTesting exec RPC...')
    const { data: data2, error: error2 } = await supabase.rpc('exec', {
      sql: 'SELECT 1 as test'
    })

    if (error2) {
      console.error('exec failed:', error2)
    } else {
      console.log('exec succeeded:', data2)
    }
  } catch (err) {
    console.error('Unexpected error:', err.message)
  }
}

testExecSql()
