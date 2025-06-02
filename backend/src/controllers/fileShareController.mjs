// ✅ FILE: /backend/src/controllers/fileShareController.js

import { db } from "../db/index.mjs";
import { logError, logInfo } from "../utils/logging/index.mjs";
import { AUDIT_EVENTS } from "../constants/audit.mjs";
import { AUTH_STATUS } from "../constants/auth.mjs";

// ✅ GET: Retrieve users a file is shared with
export const getSharedUsers = async (req, res) => {
  try {
    const { fileKey } = req.params;

    const result = await db.query(
      `SELECT id, email, role, expires_at
       FROM file_shares
       WHERE file_key = $1 AND revoked_at IS NULL`,
      [fileKey]
    );

    res.json({ users: result.rows });
  } catch (err) {
    logError("Failed to retrieve shared users", { error: err.message });
    res.status(500).json({ error: "Failed to fetch shared users" });
  }
};

// ✅ POST: Share file with another user
export const shareFile = async (req, res) => {
  try {
    const { fileKey, email, role, expiresAt } = req.body;
    const userId = req.user.id;

    const existing = await db.query(
      `SELECT id FROM file_shares WHERE file_key = $1 AND email = $2 AND revoked_at IS NULL`,
      [fileKey, email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "User already has access to this file" });
    }

    await db.query(
      `INSERT INTO file_shares (file_key, email, role, shared_by, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [fileKey, email, role, userId, expiresAt || null]
    );

    await db.query(
      `INSERT INTO audit_log (file_key, user_id, action, target_email)
       VALUES ($1, $2, $3, $4)`,
      [fileKey, userId, AUDIT_EVENTS.FILE_SHARED, email]
    );

    logInfo("File shared successfully", { fileKey, email, sharedBy: userId });
    res.status(201).json({ message: "File shared" });
  } catch (err) {
    logError("Failed to share file", { error: err.message });
    res.status(500).json({ error: "Failed to share file" });
  }
};

// ✅ PUT: Update a shared user's role
export const updateShareRole = async (req, res) => {
  try {
    const { shareId } = req.params;
    const { role } = req.body;

    const result = await db.query(
      `UPDATE file_shares SET role = $1 WHERE id = $2 AND revoked_at IS NULL RETURNING *`,
      [role, shareId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Share not found or already revoked" });
    }

    await db.query(
      `INSERT INTO audit_log (file_key, user_id, action, target_email)
       VALUES ($1, $2, $3, $4)`,
      [
        result.rows[0].file_key,
        req.user.id,
        AUDIT_EVENTS.ROLE_UPDATED,
        result.rows[0].email
      ]
    );

    res.json({ message: "Share role updated" });
  } catch (err) {
    logError("Failed to update share role", { error: err.message });
    res.status(500).json({ error: "Failed to update role" });
  }
};

// ✅ DELETE: Revoke shared user access
export const revokeShare = async (req, res) => {
  try {
    const { shareId } = req.params;

    const result = await db.query(
      `UPDATE file_shares
       SET revoked_at = NOW()
       WHERE id = $1 AND revoked_at IS NULL
       RETURNING *`,
      [shareId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Share not found or already revoked" });
    }

    await db.query(
      `INSERT INTO audit_log (file_key, user_id, action, target_email)
       VALUES ($1, $2, $3, $4)`,
      [
        result.rows[0].file_key,
        req.user.id,
        AUDIT_EVENTS.SHARE_REVOKED,
        result.rows[0].email
      ]
    );

    res.json({ message: "Access revoked" });
  } catch (err) {
    logError("Failed to revoke share", { error: err.message });
    res.status(500).json({ error: "Failed to revoke access" });
  }
};

// ✅ GET: Audit history for a file
export const getAuditLogs = async (req, res) => {
  try {
    const { fileKey } = req.params;

    const logs = await db.query(
      `SELECT action, user_id, target_email, created_at
       FROM audit_log
       WHERE file_key = $1
       ORDER BY created_at DESC`,
      [fileKey]
    );

    res.json({ logs: logs.rows });
  } catch (err) {
    logError("Failed to fetch audit logs", { error: err.message });
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
};

// ✅ GET: Email suggestions (autocomplete)
export const suggestUsers = async (req, res) => {
  try {
    const { query: search } = req.query;

    const results = await db.query(
      `SELECT DISTINCT email FROM users
       WHERE email ILIKE $1
       ORDER BY email
       LIMIT 10`,
      [`%${search}%`]
    );

    res.json({ suggestions: results.rows.map((r) => r.email) });
  } catch (err) {
    logError("Autocomplete query failed", { error: err.message });
    res.status(500).json({ error: "Suggestion lookup failed" });
  }
};
