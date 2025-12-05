const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env vars manually since we might not have dotenv configured for this script context
function loadEnv(filePath) {
  if (fs.existsSync(filePath)) {
    console.log(`Loading ${filePath}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv(path.join(__dirname, '../.env'));
loadEnv(path.join(__dirname, '../.env.local'));

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
