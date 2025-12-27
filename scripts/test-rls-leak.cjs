const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLeak() {
  console.log('Testing RLS leak on users table as anonymous user...')
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(5)

    if (error) {
      if (error.message.toLowerCase().includes('permission denied')) {
        console.log('PASS: Access denied (expected)')
      } else {
        console.error('ERROR during test:', error.message)
      }
    } else if (data && data.length > 0) {
      console.warn('FAIL: SENSITIVE DATA LEAKED!')
      console.table(data)
    } else {
      console.log('PASS: No data returned (Empty array)')
    }
    
    console.log('\nTesting RLS leak on settings table as anonymous user...')
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .limit(1)

    if (settingsError) {
      if (settingsError.message.toLowerCase().includes('permission denied')) {
        console.log('PASS: Access denied (expected)')
      } else {
        console.error('ERROR during test:', settingsError.message)
      }
    } else if (settingsData && settingsData.length > 0) {
      console.warn('FAIL: SENSITIVE DATA LEAKED (Settings)!')
      console.table(settingsData)
    } else {
      console.log('PASS: No data returned (Empty array)')
    }

  } catch (err) {
    console.error('Unexpected error:', err.message)
  }
}

testLeak()
