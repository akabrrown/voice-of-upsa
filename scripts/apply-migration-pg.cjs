const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  const rawConnectionString = process.env.DATABASE_URL;
  if (!rawConnectionString) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  // Handle password with @ symbol by manually constructing config
  // URL: postgresql://postgres:Passwod@vou1@hewrjnconmykfzggwhzg.supabase.co:5432/postgres
  const parts = rawConnectionString.match(/postgresql:\/\/([^:]+):(.+)@([^:]+):(\d+)\/(.+)/);
  if (!parts) {
    console.error('Failed to parse DATABASE_URL');
    process.exit(1);
  }

  const [_, user, password, host, port, database] = parts;

  const config = {
    user,
    password,
    host,
    port: 6543, // Try pooler port
    database,
    ssl: { rejectUnauthorized: false }
  };

  console.log(`Connecting to ${host} on port ${config.port}...`);
  const client = new Client(config);

  try {
    await client.connect();
    console.log('Connected to database');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20251222_add_exec_rpc.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration: 20251222_add_exec_rpc.sql');
    await client.query(sql);
    console.log('Migration applied successfully');

  } catch (err) {
    console.error('Error applying migration:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
