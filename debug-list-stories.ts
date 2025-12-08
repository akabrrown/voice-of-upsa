
import { supabaseAdmin } from './lib/database-server';

async function listStories() {
  if (!supabaseAdmin) {
    console.error('Supabase Admin not initialized');
    process.exit(1);
  }

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
      // Print the first ID for copy-pasting
      console.log('\nFirst Story ID:', data[0].id);
    } else {
      console.log('No stories found in the database.');
    }
  }
}

listStories();
