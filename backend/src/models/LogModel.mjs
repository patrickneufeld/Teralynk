// File: /backend/src/models/LogModel.js

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false, require: true } : false,
});

class LogModel {
  /**
   * Insert a new log entry.
   * @param {Object} log
   * @param {string} log.message
   * @param {string} log.level
   */
  static async create({ message, level = 'info' }) {
    if (!message || typeof message !== 'string') throw new Error('Message must be a non-empty string');
    const query = `
      INSERT INTO logs (message, level, timestamp)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const result = await pool.query(query, [message.trim(), level]);
    return result.rows[0];
  }

  /** Retrieve all logs */
  static async findAll() {
    const result = await pool.query(`SELECT * FROM logs ORDER BY timestamp DESC`);
    return result.rows;
  }

  /**
   * Find logs by level (e.g., 'error', 'info', 'debug')
   * @param {string} level
   */
  static async findByLevel(level) {
    const result = await pool.query(
      `SELECT * FROM logs WHERE level = $1 ORDER BY timestamp DESC`,
      [level]
    );
    return result.rows;
  }

  /**
   * Find logs between two timestamps
   * @param {string} startDate
   * @param {string} endDate
   */
  static async findByDateRange(startDate, endDate) {
    const result = await pool.query(
      `SELECT * FROM logs WHERE timestamp BETWEEN $1 AND $2 ORDER BY timestamp DESC`,
      [startDate, endDate]
    );
    return result.rows;
  }

  /**
   * Delete logs older than N days
   * @param {number} days
   */
  static async deleteOlderThan(days) {
    const result = await pool.query(
      `DELETE FROM logs WHERE timestamp < NOW() - INTERVAL '${days} days' RETURNING *`
    );
    return result.rows;
  }

  /**
   * Perform case-insensitive search on log messages
   * @param {string} searchTerm
   */
  static async search(searchTerm) {
    const result = await pool.query(
      `SELECT * FROM logs WHERE message ILIKE $1 ORDER BY timestamp DESC`,
      [`%${searchTerm}%`]
    );
    return result.rows;
  }
}

export default LogModel;
