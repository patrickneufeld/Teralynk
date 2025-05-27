// ================================================
// ✅ Audit Log Service
// File: /backend/src/services/auditLogService.mjs
// ================================================

import { sequelize } from "../config/database.mjs";
import { v4 as uuidv4 } from "uuid";
import { logError } from "../utils/logging/index.mjs";

/**
 * ✅ Inserts a structured audit event into the audit_log table.
 * @param {Object} params - Audit event parameters.
 * @param {string} params.actorId - User ID performing the action.
 * @param {string} params.action - Action performed (e.g., 'file_shared', 'file_deleted').
 * @param {string} params.targetType - Type of entity (e.g., 'file').
 * @param {string} params.targetId - Unique identifier of the target entity.
 * @param {Object} [params.metadata={}] - Optional metadata object.
 * @returns {Promise<void>}
 */
export const logAuditEvent = async ({ actorId, action, targetType, targetId, metadata = {} }) => {
  if (!actorId || !action || !targetType || !targetId) {
    throw new Error("❌ Missing required audit log parameters.");
  }

  try {
    await sequelize.query(
      `
      INSERT INTO audit_log (id, actor_id, action, target_type, target_id, metadata, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `,
      {
        replacements: [uuidv4(), actorId, action, targetType, targetId, JSON.stringify(metadata)],
        type: sequelize.QueryTypes.INSERT,
      }
    );
  } catch (err) {
    logError("AuditLogInsertError", { error: err.message, actorId, action, targetType, targetId });
    throw new Error("❌ Failed to insert audit log.");
  }
};

/**
 * ✅ Retrieves audit history for a specific entity.
 * @param {string} targetType - Type of entity (e.g., 'file').
 * @param {string} targetId - Unique identifier of the target entity.
 * @returns {Promise<Array>} Array of audit events.
 */
export const getAuditLogByTarget = async (targetType, targetId) => {
  if (!targetType || !targetId) {
    throw new Error("❌ Missing targetType or targetId.");
  }

  try {
    const { rows } = await sequelize.query(
      `
      SELECT actor_id, action, target_type, target_id, metadata, timestamp
      FROM audit_log
      WHERE target_type = $1 AND target_id = $2
      ORDER BY timestamp DESC
      LIMIT 100
      `,
      {
        replacements: [targetType, targetId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return rows.map(event => ({
      actor: event.actor_id,
      action: event.action,
      target: event.target_id,
      metadata: event.metadata,
      timestamp: event.timestamp,
    }));
  } catch (err) {
    logError("AuditLogFetchError", { error: err.message, targetType, targetId });
    throw new Error("❌ Failed to fetch audit logs.");
  }
};

/**
 * ✅ Retrieves audit logs for a specific user.
 * @param {string} actorId - User ID.
 * @returns {Promise<Array>} Array of audit events.
 */
export const getAuditLogByUser = async (actorId) => {
  if (!actorId) {
    throw new Error("❌ Missing actorId.");
  }

  try {
    const { rows } = await sequelize.query(
      `
      SELECT actor_id, action, target_type, target_id, metadata, timestamp
      FROM audit_log
      WHERE actor_id = $1
      ORDER BY timestamp DESC
      LIMIT 100
      `,
      {
        replacements: [actorId],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return rows;
  } catch (err) {
    logError("AuditLogFetchError", { error: err.message, actorId });
    throw new Error("❌ Failed to fetch audit logs for user.");
  }
};
