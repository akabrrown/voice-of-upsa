const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase keys in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  console.log('Checking for tables via REST API...');
  
  const tablesToCheck = ['team_members', 'anonymous_story_comments', 'users'];
  
  for (const table of tablesToCheck) {
    const { data, error } = await supabase
      .from(table)
      .select('count', { count: 'exact', head: true });

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation "public.' + table + '" does not exist')) {
        console.log(`RESULT: Table "${table}" does NOT exist.`);
      } else {
        console.log(`ERROR during check for "${table}":`, error.message);
      }
    } else {
      console.log(`RESULT: Table "${table}" EXISTS.`);
    }
  }
}

checkTable();
