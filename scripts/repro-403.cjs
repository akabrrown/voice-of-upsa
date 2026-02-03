// scripts/repro-403.cjs
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const anon = createClient(supabaseUrl, anonKey);

const AUTHOR_ID = '34e22590-8a37-4d29-9267-7932836f4a1e';

async function run() {
  console.log('--- Testing for 403 Forbidden with Anon Key ---');
  
  const { data, error, status, statusText } = await anon
    .from('articles')
    .select('id')
    .eq('author_id', AUTHOR_ID);

  if (error) {
    console.log('Status:', status);
    console.log('StatusText:', statusText);
    console.log('Error Message:', error.message);
  } else {
    console.log('Success! Results:', data.length);
  }
}

run();
