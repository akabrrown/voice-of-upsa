import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('--- Environment Variable Check ---');
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let missing = false;
requiredVars.forEach(key => {
  if (process.env[key]) {
    console.log(`✅ ${key} is set (Length: ${process.env[key].length})`);
  } else {
    console.log(`❌ ${key} is MISSING`);
    missing = true;
  }
});

if (missing) {
  console.error('❌ Missing required environment variables. Aborting connection test.');
  process.exit(1);
}

console.log('\n--- Supabase Connection Test ---');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Attempting to fetch users count...');
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Connection failed:', error.message);
      if (error.code) console.error('Error code:', error.code);
    } else {
      console.log('✅ Connection successful!');
      console.log(`Found ${count} users.`);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

testConnection();
