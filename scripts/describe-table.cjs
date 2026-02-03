const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function describeTable() {
  console.log('Describing table: ad_submissions');
  
  const { data, error } = await supabase.rpc('get_table_columns_info', { t_name: 'ad_submissions' });
  
  if (error) {
    console.log('RPC get_table_columns_info failed, trying direct query to information_schema...');
    const { data: cols, error: colError } = await supabase
      .from('pg_attribute')
      .select('attname, atttypid')
      .eq('attrelid', "'ad_submissions'::regclass")
      .gt('attnum', 0);
      
    if (colError) {
      // Third try: just select one row and look at keys
      console.log('Direct query failed, selecting one row and looking at keys...');
      const { data: row, error: rowError } = await supabase
        .from('ad_submissions')
        .select('*')
        .limit(1)
        .single();
        
      if (rowError) {
        console.error('Failed to get sample row:', rowError);
      } else {
        console.log('Column names found in row:', Object.keys(row));
      }
    } else {
      console.log('Columns:', cols);
    }
  } else {
    console.log('Column Info:', data);
  }
}

describeTable();
