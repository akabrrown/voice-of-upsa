const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is missing in .env');
  process.exit(1);
}

// Try port 6543 for pooling if 5432 is blocked
connectionString = connectionString.replace(':5432/', ':6543/');

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const sqlFile = process.argv[2];
  if (!sqlFile) {
    console.error('Usage: node db-execute.cjs <path-to-sql-file>');
    process.exit(1);
  }

  const sqlPath = path.resolve(sqlFile);
  if (!fs.existsSync(sqlPath)) {
    console.error(`File not found: ${sqlPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    console.log(`Connecting to database...`);
    await client.connect();
    console.log('Connected.');

    console.log('Executing SQL...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('SQL executed successfully.');
  } catch (err) {
    console.error('Error executing SQL:');
    console.error(err);
    if (client._connected) {
      await client.query('ROLLBACK').catch(e => console.error('Rollback failed:', e.message));
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
