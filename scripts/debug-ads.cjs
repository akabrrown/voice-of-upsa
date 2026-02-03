const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAds() {
  console.log('Checking advertisements in database...');
  
  const { data: ads, error } = await supabase
    .from('ad_submissions')
    .select('id, ad_title, status, created_at')
    .in('status', ['published', 'approved'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching ads:', error);
    return;
  }

  if (!ads || ads.length === 0) {
    console.log('No ads found in database.');
    return;
  }

  console.log(`Found ${ads.length} advertisements:`);
  ads.forEach(ad => {
    console.log(`- ID: ${ad.id} | Title: ${ad.ad_title} | Status: ${ad.status}`);
  });
}

checkAds();
