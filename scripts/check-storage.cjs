const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
  console.log('Checking Supabase Storage buckets...');
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('Error listing buckets:', error.message);
    return;
  }
  
  console.log('Available buckets:', buckets.map(b => b.name).join(', '));
  
  const siteAssetsExists = buckets.some(b => b.name === 'site-assets');
  if (!siteAssetsExists) {
    console.log('Bucket "site-assets" not found. Planning to create it.');
  } else {
    console.log('Bucket "site-assets" exists.');
  }
}

checkStorage();
