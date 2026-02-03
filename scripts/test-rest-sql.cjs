const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase keys.');
  process.exit(1);
}

async function runSQL() {
  const fs = require('fs');
  const path = require('path');
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251227_create_team_members.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Attempting SQL via fetch to REST API (experimental)...');

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      console.log('REST SQL failed:', await response.text());
    } else {
      console.log('SUCCESS: SQL executed via REST API (maybe?)');
    }
  } catch (err) {
    console.log('Fetch error:', err.message);
  }
}

runSQL();
