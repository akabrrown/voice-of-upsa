const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listPolicies() {
  console.log('--- Listing RLS Policies for ad_submissions ---');
  
  const { data, error } = await supabase.rpc('get_policies', { table_name: 'ad_submissions' });
  
  if (error) {
    // If RPC doesn't exist, try querying pg_policies directly
    const { data: policies, error: pgError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'ad_submissions');
      
    if (pgError) {
      // Fallback: Use a direct SQL query if possible (using service role might allow reading catalogs)
      const { data: rawPolicies, error: rawError } = await supabase
        .from('pg_catalog.pg_policies')
        .select('*')
        .eq('tablename', 'ad_submissions');
        
      if (rawError) {
        console.log('Could not fetch policies via typical methods. Trying manual check via attempts...');
        return;
      }
      console.log('Policies:', rawPolicies);
    } else {
      console.log('Policies:', policies);
    }
  } else {
    console.log('Policies:', data);
  }
}

// Since I might not have the RPC, let's just use a more reliable method if possible
// Or I'll just rely on the test script results.

listPolicies();
