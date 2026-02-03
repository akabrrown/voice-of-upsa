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

async function checkRLS() {
  console.log('Checking RLS on public.users...');
  
  // We can't easily check pg_class/pg_policy via supabase-js without an RPC
  // But we can try to infer it or just assume we need to execute a safe SQL command.
  // Actually, let's try to query pg_tables via a known view or just try to list users as anon in the next step.
  
  // Since I can't run RAW SQL easily here without the exec RPC (which might be available?),
  // I will assume standard Supabase setup which usually has RLS.
  
  // Let's try to use the 'exec' RPC if we added it earlier? 
  // I see '20251222_add_exec_rpc.sql' in the open files list in previous turns.
  
  const { data, error } = await supabase.rpc('exec', {
    query: "SELECT relname, relrowsecurity FROM pg_class WHERE oid = 'public.users'::regclass;"
  });

  if (error) {
    console.log('Error checking RLS (RPC exec might be missing/failed):', error.message);
    console.log('Proceeding with caution.');
    return;
  }

  console.log('RLS Check Result:', data);
}

checkRLS();
