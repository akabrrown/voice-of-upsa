const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function checkGrants() {
  console.log('--- Checking Grants for users and articles ---');
  
  const tablesSql = `
    SELECT table_name, grantee, privilege_type 
    FROM information_schema.role_table_grants 
    WHERE table_name IN ('users', 'articles')
    AND grantee IN ('anon', 'authenticated', 'public')
  `;

  const funcsSql = `
    SELECT routine_name, security_type, routine_definition, routine_owner 
    FROM information_schema.routines 
    WHERE routine_name IN ('is_editor', 'is_admin')
  `;

  const schemasSql = `
    SELECT schema_name, grantee, privilege_type 
    FROM information_schema.usage_privileges 
    WHERE object_type = 'SCHEMA' 
    AND schema_name IN ('public', 'auth')
    AND grantee IN ('anon', 'authenticated', 'public')
  `;

  const { data: tableData, error: tableError } = await supabase.rpc('exec', { sql: tablesSql });
  const { data: funcData, error: funcError } = await supabase.rpc('exec', { sql: funcsSql });
  const { data: schemaData, error: schemaError } = await supabase.rpc('exec', { sql: schemasSql });

  if (tableError || funcError || schemaError) {
    console.error('RPC Error:', tableError || funcError || schemaError);
    return;
  }

  console.log('--- Table Grants ---');
  console.table(tableData);
  console.log('--- Function Definitions ---');
  console.table(funcData);
  console.log('--- Schema Usage ---');
  console.table(schemaData);
}

checkGrants();
