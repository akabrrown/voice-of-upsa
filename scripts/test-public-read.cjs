const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('Missing Supabase keys.');
  process.exit(1);
}

// Create client with ANON key (simulating public user)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPublicAccess() {
  console.log('Testing public access with ANON key...');
  
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.log('Error accessing team_members (Public):');
    console.log(JSON.stringify(error, null, 2));
  } else {
    console.log(`Success! Found ${data.length} active team members.`);
    console.log('Data sample:', data.slice(0, 1));
  }
}

checkPublicAccess();
