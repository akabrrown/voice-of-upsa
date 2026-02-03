const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLaundryVilleAds() {
  console.log('Searching for ads related to "LaundryVille"...');

  // Search in ad_submissions
  const { data: ads, error: adError } = await supabase
    .from('ad_submissions')
    .select('*')
    .or('ad_title.ilike.%LaundryVille%,company.ilike.%LaundryVille%');

  if (adError) {
    console.error('Error fetching ads:', adError);
    return;
  }

  if (!ads || ads.length === 0) {
    console.log('No ads found for "LaundryVille".');
    return;
  }

  for (const ad of ads) {
    console.log(`\n--- Ad Found ---`);
    console.log(`ID: ${ad.id}`);
    console.log(`Title: ${ad.ad_title}`);
    console.log(`Company: ${ad.company}`);
    console.log(`Status: ${ad.status}`);
    console.log(`Ad Type: ${ad.ad_type}`);

    // Fetch locations
    const { data: locations, error: locError } = await supabase
      .from('ad_submission_locations')
      .select(`
        ad_locations (
          name,
          display_name,
          page_location
        )
      `)
      .eq('ad_submission_id', ad.id);

    if (locError) {
      console.error(`Error fetching locations for ad ${ad.id}:`, locError);
      continue;
    }

    if (!locations || locations.length === 0) {
      console.log('No specific locations assigned in ad_submission_locations.');
    } else {
      console.log('Assigned Locations:');
      locations.forEach(l => {
        const details = l.ad_locations;
        console.log(` - ${details.display_name} (${details.name}) on ${details.page_location}`);
      });
    }
  }
}

checkLaundryVilleAds();
