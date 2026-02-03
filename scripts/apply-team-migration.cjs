const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const rawConnectionString = process.env.DATABASE_URL;

if (!rawConnectionString) {
  console.log('Error: DATABASE_URL is missing.');
  process.exit(1);
}

// Manually parse connection string to handle @ in password
// Pattern: postgresql://user:password@host:port/database
// We use a regex that handles the first @ for the host, assuming the rest is password
const match = rawConnectionString.match(/postgresql:\/\/([^:]+):(.+)@([^:]+):(\d+)\/(.+)/);
if (!match) {
  console.log('Error: Failed to parse DATABASE_URL with regex.');
  process.exit(1);
}

const [_, user, password, host, port, database] = match;

const client = new Client({
  user,
  password,
  host,
  port: 6543, // Using pooler port as seen in project scripts
  database,
  ssl: {
    rejectUnauthorized: false
  }
});

async function applyMigration() {
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251227_create_team_members.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.log(`Error: Migration file not found at ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log(`Attempting to connect to ${host} on port 6543...`);

  try {
    await client.connect();
    console.log('Successfully connected to database.');

    console.log('Executing SQL migration...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('SUCCESS: Migration applied successfully.');
  } catch (err) {
    console.log('FAILURE: Migration failed!');
    console.log('Error Message:', err.message);
    
    try {
      if (client._connected) {
        await client.query('ROLLBACK');
        console.log('Transaction rolled back.');
      }
    } catch (rbErr) {
      console.log('Rollback error:', rbErr.message);
    }
    
    process.exit(1);
  } finally {
    await client.end();
    console.log('Connection closed.');
  }
}

applyMigration();
