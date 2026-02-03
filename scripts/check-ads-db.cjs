const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkSchema() {
  console.log('Checking ad_submissions triggers and default values...');
  
  // Checking for triggers is harder via standard API, but we can check column info
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: `
      SELECT 
        column_name, 
        column_default, 
        is_nullable, 
        data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ad_submissions';
    `
  });

  if (error) {
    console.error('Error fetching schema:', error);
  } else {
    console.log('Columns:', JSON.stringify(data, null, 2));
  }

  const { data: triggers, error: triggerError } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'ad_submissions';
    `
  });

  if (triggerError) {
    console.error('Error fetching triggers:', triggerError);
  } else {
    console.log('Triggers:', JSON.stringify(triggers, null, 2));
  }
}

checkSchema();
