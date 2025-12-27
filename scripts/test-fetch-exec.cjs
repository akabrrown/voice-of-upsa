const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function testFetchExec() {
  console.log('Testing exec RPC via direct fetch...')
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
      },
      body: JSON.stringify({
        sql: 'SELECT 1 as test'
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Fetch failed:', response.status, text)
    } else {
      const data = await response.json();
      console.log('Fetch succeeded:', data)
    }
  } catch (err) {
    console.error('Unexpected error:', err.message)
  }
}

testFetchExec()
