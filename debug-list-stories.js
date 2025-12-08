
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function listStories() {
  console.log('Fetching anonymous stories...');
  const { data, error } = await supabaseAdmin
    .from('anonymous_stories')
    .select('id, title, status, views_count');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Stories found:', data?.length);
    if (data && data.length > 0) {
      console.table(data);
      console.log('\nFirst Story ID:', data[0].id);
    } else {
      console.log('No stories found in the database.');
    }
  }
}

listStories();
