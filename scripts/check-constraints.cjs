const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try to get env vars from .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
      process.env[k] = envConfig[k];
    }
  }
} catch (e) {
  console.log('Error loading .env.local:', e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConstraints() {
  console.log('Checking constraints for articles table...');
  
  // We can't query information_schema directly easily via loose access sometimes
  // But we can use our 'exec' RPC if it works (from previous turns, it was discussed but maybe not working fully?)
  // Actually, let's try to infer from a failed insert OR just try to query pg_constraint if we have rpc 'exec'
  
  // Plan B: Use the rpc 'exec' if available. Previous context said we have `exec` or `exec_sql`.
  
  const { data, error } = await supabase.rpc('exec', {
    sql: `
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'public.articles'::regclass;
    `
  });

  if (error) {
    console.error('Error fetching constraints via RPC:', error);
    // Fallback: try to query check_constraints via postgrest if accessible (unlikely for system catalogs)
    // Detailed error might help.
  } else {
    console.log('Constraints:', data);
  }
}

checkConstraints();
