const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettingsTables() {
  console.log('Checking database settings tables...');
  
  // Check 'settings' table
  console.log('\n--- Checking "settings" table ---');
  const { data: settingsData, error: settingsError } = await supabase
    .from('settings')
    .select('*')
    .limit(1);
  
  if (settingsError) {
    console.error('Error fetching from "settings":', settingsError.message);
  } else {
    console.log('Data from "settings":', JSON.stringify(settingsData, null, 2));
  }
  
  // Check 'site_settings' table
  console.log('\n--- Checking "site_settings" table ---');
  const { data: siteSettingsData, error: siteSettingsError } = await supabase
    .from('site_settings')
    .select('*')
    .limit(1);
  
  if (siteSettingsError) {
    console.error('Error fetching from "site_settings":', siteSettingsError.message);
  } else {
    console.log('Data from "site_settings":', JSON.stringify(siteSettingsData, null, 2));
  }
}

checkSettingsTables();
