require('dotenv').config({ path: '.env.migration' });
const { createClient } = require('@supabase/supabase-js');

const oldSupabase = createClient(
  process.env.OLD_SUPABASE_URL,
  process.env.OLD_SUPABASE_SERVICE_ROLE_KEY
);

const newSupabase = createClient(
  process.env.NEW_SUPABASE_URL,
  process.env.NEW_SUPABASE_SERVICE_ROLE_KEY
);

async function migrateAds() {
  console.log('Fetching ads from old database...');
  const { data: oldAds, error: oldErr } = await oldSupabase.from('ad_submissions').select('*');
  
  if (oldErr) {
    console.error('Failed to fetch old ads:', oldErr);
    return;
  }
  
  if (!oldAds || oldAds.length === 0) {
    console.log('No ads found to migrate.');
    return;
  }
  
  console.log(`Found ${oldAds.length} ads. Transforming...`);
  
  const newAds = oldAds.map(ad => {
    const contactName = `${ad.first_name || ''} ${ad.last_name || ''}`.trim() || 'Unknown';
    const companyName = ad.company || contactName;
    
    // Map status
    let status = 'pending';
    if (ad.status === 'published' || ad.status === 'active') status = 'active';
    else if (ad.status === 'rejected') status = 'rejected';
    
    // Map ad_type
    let adType = 'sidebar'; // default
    if (ad.ad_type === 'banner' || ad.ad_type === 'leaderboard') adType = 'leaderboard';
    else if (ad.ad_type === 'in-feed') adType = 'in-feed';

    // Creative URL
    let creativeUrl = null;
    if (ad.attachment_urls && ad.attachment_urls.length > 0) {
      creativeUrl = ad.attachment_urls[0];
    }
    
    return {
      id: ad.id,
      company_name: companyName,
      contact_name: contactName,
      contact_email: ad.email || 'no-reply@upsa.edu.gh',
      ad_type: adType,
      creative_url: creativeUrl,
      target_url: ad.website || null,
      package_tier: 'standard', // default
      status: status,
      starts_at: ad.start_date ? new Date(ad.start_date).toISOString() : null,
      ends_at: ad.due_date ? new Date(ad.due_date).toISOString() : null,
      created_at: ad.created_at || new Date().toISOString(),
      product_name: ad.ad_title || null,
      product_description: ad.ad_description || null,
      contact_phone: ad.phone || null
    };
  });
  
  console.log('Inserting into new database...');
  const { error: newErr } = await newSupabase.from('advertisements').upsert(newAds, { onConflict: 'id' });
  
  if (newErr) {
    console.error('❌ Failed to insert ads:', newErr);
  } else {
    console.log(`✅ Successfully migrated ${newAds.length} ads to the advertisements table!`);
  }
}

migrateAds();
