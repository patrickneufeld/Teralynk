// ====================================================
// ✅ FILE: /backend/src/models/mcpConfigModel.mjs
// Model for storing customer-specific MCP configurations
// ====================================================

// Correct relative path from models → ../../db/pg.mjs
import { pool, query } from '../../db/pg.mjs';

const TABLE_NAME = 'mcp_configs';

/**
 * Ensure table exists
 */
export async function initMCPConfigTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id SERIAL PRIMARY KEY,
      customer_id TEXT NOT NULL,
      server_id TEXT NOT NULL,
      config JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (customer_id, server_id)
    );
  `);
}

/**
 * Save or update MCP config for a customer + server
 */
export async function saveMCPConfig(customerId, serverId, config) {
  const result = await db.query(
    `
    INSERT INTO ${TABLE_NAME} (customer_id, server_id, config, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (customer_id, server_id)
    DO UPDATE SET config = $3, updated_at = NOW()
    RETURNING *;
    `,
    [customerId, serverId, config]
  );

  return result.rows[0];
}

/**
 * Load all enabled configs for a customer
 */
export async function getCustomerMCPConfigs(customerId) {
  const result = await db.query(
    `SELECT server_id, config FROM ${TABLE_NAME} WHERE customer_id = $1`,
    [customerId]
  );

  return result.rows.reduce((acc, row) => {
    acc[row.server_id] = row.config;
    return acc;
  }, {});
}

/**
 * Load a specific server config
 */
export async function getMCPConfig(customerId, serverId) {
  const result = await db.query(
    `SELECT config FROM ${TABLE_NAME} WHERE customer_id = $1 AND server_id = $2`,
    [customerId, serverId]
  );

  return result.rows[0]?.config || null;
}

/**
 * Delete a customer's config for a specific MCP server
 */
export async function deleteMCPConfig(customerId, serverId) {
  await db.query(
    `DELETE FROM ${TABLE_NAME} WHERE customer_id = $1 AND server_id = $2`,
    [customerId, serverId]
  );
}
