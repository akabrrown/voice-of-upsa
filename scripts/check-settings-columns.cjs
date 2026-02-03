const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .limit(1)
    .single();
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Columns in settings table:', Object.keys(data));
  console.log('Sample Data:', JSON.stringify(data, null, 2));
}

checkColumns();
