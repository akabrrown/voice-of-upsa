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

async function testExec() {
  console.log('Testing "exec" RPC...');
  
  const { data, error } = await supabase.rpc('exec', { 
    sql: 'SELECT 1 as val' 
  });

  if (error) {
    console.log('RPC "exec" failed or missing:', error.message);
    if (error.details) console.log('Details:', error.details);
  } else {
    console.log('SUCCESS: "exec" RPC is available!', data);
  }
}

testExec();
