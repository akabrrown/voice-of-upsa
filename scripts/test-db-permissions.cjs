const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
function loadEnv(filePath) {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
                if (!process.env[key]) process.env[key] = value;
            }
        });
    }
}
loadEnv(path.resolve(process.cwd(), '.env.local'));
loadEnv(path.resolve(process.cwd(), '.env'));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function test() {
    console.log('Testing access to "users"...');
    const { data: users, error: userError } = await supabase.from('users').select('id').limit(1);
    if (userError) console.error('Users Error:', userError.message);
    else console.log('Users access OK');

    console.log('Testing access to "notification_preferences"...');
    const { data: prefs, error: prefError } = await supabase.from('notification_preferences').select('*').limit(1);
    
    if (prefError) {
        console.error('CRITICAL: notification_preferences Access Failed:', prefError.message);
        console.error('Likely cause: service_role does not have permissions on this table.');
    } else {
        console.log('notification_preferences access OK');
    }
}

test();
