import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client } = pg;

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read and execute migration
    const migrationPath = join(__dirname, '../supabase/migrations/20251219_seed_article_categories.sql');
    const sql = readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration: 20251219_seed_article_categories.sql');
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify categories were created
    const result = await client.query('SELECT name, slug FROM categories ORDER BY order_index');
    console.log('\nCategories in database:');
    result.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.slug})`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
