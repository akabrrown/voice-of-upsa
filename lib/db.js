/**
 * Database Connection and Query Utility
 * Secure database connection with connection pooling
 */

import { Pool } from 'pg';

let pool;

/**
 * Get database connection pool
 */
export const getPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
};

/**
 * Execute database query with error handling and logging
 */
export const query = async (text, params = []) => {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log query performance (remove sensitive data in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Query executed', { 
        text: text.substring(0, 100), 
        duration, 
        rows: res.rowCount,
        params: params.length 
      });
    }
    
    return res;
  } catch (error) {
    console.error('Database query error:', {
      error: error.message,
      code: error.code,
      text: text.substring(0, 100),
      params: params.length
    });
    throw error;
  }
};

/**
 * Execute transaction with multiple queries
 */
export const transaction = async (queries) => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const results = [];
    
    for (const { text, params } of queries) {
      const result = await client.query(text, params);
      results.push(result);
    }
    
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Test database connection
 */
export const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as current_time, version() as version');
    return {
      success: true,
      time: result.rows[0].current_time,
      version: result.rows[0].version
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get database statistics
 */
export const getDatabaseStats = async () => {
  try {
    const stats = await query(`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public'
      LIMIT 10
    `);
    
    return {
      success: true,
      stats: stats.rows
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Close database connection pool
 */
export const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

const dbExports = {
  query,
  transaction,
  testConnection,
  getDatabaseStats,
  closePool,
  getPool
};

export default dbExports;
