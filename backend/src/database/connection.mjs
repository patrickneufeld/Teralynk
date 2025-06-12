// Create this file at: /backend/src/database/connection.js

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'teralynk',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
});

export const db = {
  query: (text, params) => pool.query(text, params),
  pool: pool,
};
