const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase keys.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  console.log('Listing all tables in public schema...');
  
  // Method 1: Query information_schema
  // Note: RLS might block this on client side, but service_role should see it?
  // Actually, Supabase restricts access to system tables via REST usually.
  
  // Let's try to query a known existing table and then try to "inspect" via rpc if possible,
  // but we don't have a list_tables RPC.
  
  // Alternative: Try to just select from team_members again with full error logging
  console.log('\n--- Checking team_members specifically ---');
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Error accessing team_members:');
    console.log(JSON.stringify(error, null, 2));
  } else {
    console.log('Success! team_members exists. Sample data:', data);
  }

  // Also check anonymous_story_comments for comparison
  console.log('\n--- Checking anonymous_story_comments (baseline) ---');
  const { data: data2, error: error2 } = await supabase
    .from('anonymous_story_comments')
    .select('*')
    .limit(1);
    
  if (error2) {
    console.log('Error accessing anonymous_story_comments:', JSON.stringify(error2, null, 2));
  } else {
    console.log('Success! anonymous_story_comments exists.');
  }
}

listTables();
