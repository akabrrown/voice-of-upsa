const fs = require('fs');
const path = require('path');

// Basic JWT decoder (no verification, just reading payload)
function parseJwt(token) {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

// Polyfill atob if needed (Node 14-)
if (typeof atob === 'undefined') {
    global.atob = function (str) {
        return Buffer.from(str, 'base64').toString('binary');
    };
}

// Load env
function loadEnv(filePath) {
    if (fs.existsSync(filePath)) {
        console.log(`Loading ${filePath}...`);
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

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('--- Env Check ---');
console.log('SUPABASE_SERVICE_ROLE_KEY present:', !!serviceKey);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY present:', !!anonKey);

if (serviceKey) {
    const payload = parseJwt(serviceKey);
    console.log('Service Key Role Claim:', payload ? payload.role : 'Invalid Token');
    if (payload && payload.role !== 'service_role') {
        console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY does NOT have "service_role" role! It has:', payload.role);
    } else {
        console.log('Service Key looks valid (role: service_role).');
    }
}

if (serviceKey && anonKey && serviceKey === anonKey) {
    console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is identical to NEXT_PUBLIC_SUPABASE_ANON_KEY!');
} else {
    console.log('Keys are distinct.');
}
