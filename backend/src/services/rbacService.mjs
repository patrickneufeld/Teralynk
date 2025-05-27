// ✅ FILE: /backend/src/services/rbacService.js

import pkg from 'pg';
const { Pool } = pkg;
import { logInfo, logError, logWarn } from '../utils/logger.mjs';

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false, require: true },
});

/**
 * ✅ Check if the user has a specific named permission (strict match)
 * @param {string} userId 
 * @param {string} permission 
 * @returns {Promise<boolean>}
 */
export const hasPermission = async (userId, permission) => {
  try {
    const query = `
      SELECT 1
      FROM user_permissions
      WHERE user_id = $1
        AND permission = $2
      LIMIT 1
    `;
    const { rowCount } = await pool.query(query, [userId, permission]);
    return rowCount > 0;
  } catch (err) {
    logError('RBAC: hasPermission check failed', { userId, permission, error: err.message });
    return false;
  }
};

/**
 * ✅ Get the user's assigned role
 * @param {string} userId 
 * @returns {Promise<string|null>}
 */
export const getUserRole = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT role FROM users WHERE id = $1`,
      [userId]
    );
    return result.rows[0]?.role || null;
  } catch (err) {
    logError('RBAC: getUserRole lookup failed', { userId, error: err.message });
    return null;
  }
};

/**
 * ✅ Determine if a user has access to a specific AI provider
 * @param {string} userId 
 * @param {string} provider ('openai' | 'claude' | 'bedrock')
 * @returns {Promise<boolean>}
 */
export const hasProviderAccess = async (userId, provider) => {
  try {
    const requiredPermission = `ai_access:${provider}`;
    const allowed = await hasPermission(userId, requiredPermission);

    if (!allowed) {
      logWarn('RBAC: Provider access denied', { userId, provider });
    } else {
      logInfo('RBAC: Provider access granted', { userId, provider });
    }

    return allowed;
  } catch (err) {
    logError('RBAC: hasProviderAccess failed', { userId, provider, error: err.message });
    return false;
  }
};

/**
 * ✅ List all permissions assigned to a user
 * @param {string} userId 
 * @returns {Promise<string[]>}
 */
export const listUserPermissions = async (userId) => {
  try {
    const { rows } = await pool.query(
      `SELECT permission FROM user_permissions WHERE user_id = $1`,
      [userId]
    );
    return rows.map(r => r.permission);
  } catch (err) {
    logError('RBAC: listUserPermissions failed', { userId, error: err.message });
    return [];
  }
};
