// ✅ FILE: /backend/src/services/fileShareService.js

import db from "../services/db.mjs";
const { v4: uuidv4 } = await import("uuid.js");
const { logInfo, logError } = await import("../utils/logging/logging.js");
import auditLogService from "./auditLogService.mjs";

// 🔐 Get all shares for a file
export const getShares = async (fileKey) => {
  const result = await db.query(
    `SELECT id, email, role, user_id, expires_at FROM file_shares WHERE file_key = $1 ORDER BY created_at DESC`,
    [fileKey]
  );
  return result.rows;
};

// ➕ Add a new share
export const addShare = async ({ fileKey, email, role, expiresAt, actor }) => {
  if (!fileKey || !email || !role) {
    throw new Error("Missing required fields for file sharing");
  }

  // Prevent duplicate sharing
  const existing = await db.query(
    `SELECT id FROM file_shares WHERE file_key = $1 AND LOWER(email) = LOWER($2)`,
    [fileKey, email]
  );
  if (existing.rows.length > 0) {
    throw new Error("User already has access to this file");
  }

  const id = uuidv4();
  const inserted = await db.query(
    `INSERT INTO file_shares (id, file_key, email, role, expires_at, user_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     RETURNING id, email, role, expires_at`,
    [id, fileKey, email, role, expiresAt || null, actor]
  );

  await auditLogService.log("share_added", actor, fileKey, email, { role, expiresAt });

  return inserted.rows[0];
};

// 🔄 Update role of an existing share
export const updateShareRole = async (shareId, newRole) => {
  const result = await db.query(
    `UPDATE file_shares SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, role, email`,
    [newRole, shareId]
  );

  if (result.rowCount === 0) throw new Error("Share record not found");

  await auditLogService.log("share_role_updated", null, null, result.rows[0].email, { role: newRole });

  return result.rows[0];
};

// ❌ Revoke access
export const revokeShare = async (shareId, actorId) => {
  const share = await db.query(
    `SELECT file_key, email FROM file_shares WHERE id = $1`,
    [shareId]
  );

  if (share.rowCount === 0) throw new Error("Share not found");

  const { file_key, email } = share.rows[0];

  await db.query(`DELETE FROM file_shares WHERE id = $1`, [shareId]);

  await auditLogService.log("share_revoked", actorId, file_key, email, {});
};

// 🕵️ View audit trail for a file
export const getAudit = async (fileKey) => {
  const result = await db.query(
    `SELECT timestamp, actor_id, action, target, metadata
     FROM audit_log
     WHERE context = $1
     ORDER BY timestamp DESC`,
    [fileKey]
  );
  return result.rows;
};

// 🔎 Autocomplete user emails
export const searchUsers = async (query) => {
  if (!query || query.length < 2) return [];

  const result = await db.query(
    `SELECT DISTINCT email FROM users
     WHERE email ILIKE $1
     ORDER BY email ASC
     LIMIT 10`,
    [`%${query}%`]
  );

  return result.rows.map(row => row.email);
};
