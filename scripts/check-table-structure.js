import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkTableStructure() {
  try {
    console.log('Checking users table structure...');
    
    // Get table columns
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n=== Users Table Structure ===');
    result.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})${col.column_default ? ` default: ${col.column_default}` : ''}`);
    });
    
    // Test a simple query
    console.log('\n=== Testing Query ===');
    const testResult = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`Total users: ${testResult.rows[0].count}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTableStructure();
