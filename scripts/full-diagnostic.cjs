const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const anon = createClient(supabaseUrl, anonKey);
const service = createClient(supabaseUrl, serviceKey);

async function runDiagnostics() {
  console.log('=== FULL DIAGNOSTIC REPORT ===\n');

  // 1. Test anonymous access to published articles
  console.log('1. Testing anonymous access to published articles...');
  const { data: pubArticles, error: pubError } = await anon
    .from('articles')
    .select('id, title, status')
    .eq('status', 'published')
    .limit(5);
  
  if (pubError) {
    console.error('❌ ERROR:', pubError.message);
    console.error('   Code:', pubError.code);
  } else {
    console.log('✅ SUCCESS: Found', pubArticles.length, 'published articles');
  }

  // 2. Check if is_editor and is_admin functions exist
  console.log('\n2. Checking helper functions...');
  const { data: isEditorTest, error: isEditorError } = await service.rpc('is_editor', { user_id: '00000000-0000-0000-0000-000000000000' });
  const { data: isAdminTest, error: isAdminError } = await service.rpc('is_admin', { user_id: '00000000-0000-0000-0000-000000000000' });
  
  console.log('is_editor function:', isEditorError ? '❌ ' + isEditorError.message : '✅ EXISTS');
  console.log('is_admin function:', isAdminError ? '❌ ' + isAdminError.message : '✅ EXISTS');

  // 3. Check current RLS policies on articles
  console.log('\n3. Checking articles RLS policies...');
  const { data: policies, error: policiesError } = await service.rpc('exec', {
    sql: `SELECT policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename = 'articles'`
  });
  
  if (policiesError) {
    console.error('❌ Cannot fetch policies:', policiesError.message);
  } else {
    console.table(policies);
  }

  // 4. Test the specific query that's failing
  console.log('\n4. Testing the failing query (author_id filter)...');
  const { data: authorArticles, error: authorError } = await anon
    .from('articles')
    .select('id')
    .eq('author_id', '34e22590-8a37-4d29-9267-7932836f4a1e');
  
  if (authorError) {
    console.error('❌ ERROR:', authorError.message);
    console.error('   Code:', authorError.code);
    console.error('   Details:', authorError.details);
  } else {
    console.log('✅ SUCCESS: Found', authorArticles.length, 'articles');
  }

  console.log('\n=== END DIAGNOSTIC ===');
}

runDiagnostics();
