// ================================================
// ✅ FILE: /backend/db/pg.mjs
// PostgreSQL Connection with Optional SSL Support
// ================================================

import pg from 'pg';
const { Pool } = pg;

// Support both PG_* and DB_* env vars
const DB_HOST = process.env.PGHOST || process.env.DB_HOST;
const DB_NAME = process.env.PGDATABASE || process.env.DB_NAME;
const DB_USER = process.env.PGUSER || process.env.DB_USER;
const DB_PASSWORD = process.env.PGPASSWORD || process.env.DB_PASSWORD;
const DB_PORT = process.env.PGPORT || process.env.DB_PORT || 5432;
const USE_SSL =
  process.env.PG_USE_SSL === 'true' ||
  process.env.DB_SSL === 'true' ||
  process.env.NODE_ENV === 'production';

// Optional SSL config
const sslConfig = USE_SSL ? { rejectUnauthorized: false } : false;

if (!DB_HOST || !DB_NAME || !DB_USER || !DB_PASSWORD) {
  console.error('[Postgres] ❌ Missing required DB environment variables');
  process.exit(1);
}

const pool = new Pool({
  host: DB_HOST,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  port: Number(DB_PORT),
  ssl: sslConfig,
  max: Number(process.env.DB_POOL_MAX) || 20,
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT) || 2000,
});

// Initial connection verification
pool.connect((err, client, release) => {
  if (err) {
    console.error('[Postgres] ❌ Error acquiring client:', err);
    process.exit(1);
  } else {
    console.log(
      `[Postgres] ✅ Connected to ${DB_NAME} as ${DB_USER} at ${DB_HOST}:${DB_PORT} (${USE_SSL ? 'SSL' : 'No SSL'})`
    );
    release();
  }
});

/**
 * Execute a SQL query with optional parameterization
 * @param {string} text - SQL statement
 * @param {Array} [params] - Parameterized values
 * @returns {Promise<object>} - Query result
 */
export async function query(text, params = []) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('[Postgres] 📥 Query executed', {
      text,
      duration: `${duration}ms`,
      rows: result.rowCount,
    });
    return result;
  } catch (err) {
    console.error('[Postgres] ❌ Query failed:', { text, error: err });
    throw err;
  }
}

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('[Postgres] 📴 Closing pool (SIGINT)');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Postgres] 📴 Closing pool (SIGTERM)');
  await pool.end();
  process.exit(0);
});

export { pool };
