const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function getOpenAPI() {
  console.log('Fetching OpenAPI spec...')
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Fetch failed:', response.status, text)
    } else {
      const data = await response.json();
      fs.writeFileSync('openapi.json', JSON.stringify(data, null, 2));
      console.log('OpenAPI spec saved to openapi.json')
      
      // List RPCs
      const paths = Object.keys(data.paths);
      const rpcs = paths.filter(p => p.startsWith('/rpc/'));
      console.log('Found RPCs:', rpcs);
    }
  } catch (err) {
    console.error('Unexpected error:', err.message)
  }
}

getOpenAPI()
