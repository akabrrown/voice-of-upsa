import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy";

const adminClient = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkColumns() {
  const { data, error } = await adminClient.rpc('get_table_columns_v2', { table_name: 'notifications' });
  if (error) {
    console.log("RPC Error:", error.message);
    
    // Fallback: try to insert a dummy record and look at the error message for hints
    const res = await adminClient.from('notifications').insert({}).select('*');
    console.log("Insert Error Details:", res.error);
  } else {
    console.log("Columns:", data);
  }
}

checkColumns();
