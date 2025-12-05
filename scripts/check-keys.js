const fs = require('fs');
const path = require('path');

function loadEnv(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
        if (!process.env[key]) process.env[key] = value;
      }
    });
  }
}

loadEnv(path.join(__dirname, '../.env'));
loadEnv(path.join(__dirname, '../.env.local'));

function decodeJwt(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const payload = Buffer.from(parts[1], 'base64').toString('utf8');
  return JSON.parse(payload);
}

console.log('--- Checking API Keys ---');

const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const anonDecoded = decodeJwt(anonKey);
const serviceDecoded = decodeJwt(serviceKey);

console.log('\nAnon Key Role:', anonDecoded ? anonDecoded.role : 'Invalid');
console.log('Service Key Role:', serviceDecoded ? serviceDecoded.role : 'Invalid');

if (serviceDecoded && serviceDecoded.role === 'service_role') {
  console.log('\n✅ Service role key is valid.');
} else {
  console.error('\n❌ Service role key is INVALID or has wrong role.');
}
