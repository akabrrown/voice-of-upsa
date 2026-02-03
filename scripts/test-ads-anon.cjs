const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAdsAnon() {
  console.log('Checking advertisements in database using ANON key...');
  
  const { data: ads, error } = await supabase
    .from('ad_submissions')
    .select('id, ad_title, status, created_at')
    .in('status', ['published', 'approved'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching ads (ANON):', error.message, error.code);
    return;
  }

  console.log(`Found ${ads?.length || 0} advertisements with ANON key.`);
}

checkAdsAnon();
