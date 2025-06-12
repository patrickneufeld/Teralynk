// ✅ FILE: /backend/src/routes/userRoutes.js

// File: /backend/src/routes/userRoutes.mjs

import express from 'express';
import pkg from 'pg';
import { requireAuth } from '../middleware/authMiddleware.mjs';
import { getUserFromToken } from '../utils/tokenUtils.mjs';

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false, require: true },
});

const router = express.Router();


/**
 * @route GET /api/users/user-data
 */
router.get("/user-data", requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const user = req.user || (await getUserFromToken(token));

    if (!user || !user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const result = await pool.query(
      `SELECT id, email, username, created_at FROM users WHERE id = $1`,
      [user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = result.rows[0];
    return res.json({
      id: userData.id,
      username: userData.username || userData.email,
      email: userData.email,
      memberSince: userData.created_at,
    });
  } catch (err) {
    console.error("❌ Error in /user-data:", err);
    return res.status(500).json({ error: "Failed to fetch user data." });
  }
});

/**
 * @route GET /api/users/profile
 */
router.get("/profile", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, username FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];
    return res.json({
      id: user.id,
      username: user.username || user.email,
      email: user.email,
    });
  } catch (err) {
    console.error("❌ Error in /profile:", err);
    return res.status(500).json({ error: "Failed to fetch profile." });
  }
});

/**
 * @route POST /api/users/add-service
 */
router.post("/add-service", requireAuth, async (req, res) => {
  try {
    const { serviceType, serviceData } = req.body;

    if (!serviceType || !serviceData) {
      return res.status(400).json({ error: "Missing serviceType or serviceData" });
    }

    const result = await pool.query(
      `INSERT INTO user_services (user_id, service_type, service_data)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, serviceType, serviceData]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error in /add-service:", err);
    return res.status(500).json({ error: "Failed to add service." });
  }
});

/**
 * @route GET /api/users/storage
 */
router.get("/storage", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COALESCE(SUM(size), 0) AS total_storage
       FROM user_files WHERE user_id = $1`,
      [req.user.id]
    );

    return res.json({ totalStorage: result.rows[0].total_storage });
  } catch (err) {
    console.error("❌ Error in /storage:", err);
    return res.status(500).json({ error: "Failed to fetch storage info." });
  }
});

/**
 * @route GET /api/users/:id
 */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, username, role, created_at, updated_at
       FROM users WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error in /:id:", err);
    return res.status(500).json({ error: "Failed to fetch user." });
  }
});

/**
 * @route PUT /api/users/:id
 */
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { email, username, role } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET email = COALESCE($1, email),
           username = COALESCE($2, username),
           role = COALESCE($3, role),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [email, username, role, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error in PUT /:id:", err);
    return res.status(500).json({ error: "Failed to update user." });
  }
});

/**
 * @route POST /api/users/logout
 */
router.post("/logout", requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(400).json({ error: "Missing token for logout." });
    }

    await pool.query(
      `UPDATE auth_sessions SET invalidated_at = NOW() WHERE user_id = $1 AND token = $2`,
      [req.user.id, token]
    );

    return res.json({ message: "Successfully logged out." });
  } catch (err) {
    console.error("❌ Error in /logout:", err);
    return res.status(500).json({ error: "Failed to logout." });
  }
});

/**
 * @route GET /api/users/role/:id
 */
router.get("/role/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT role FROM users WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ role: result.rows[0].role });
  } catch (err) {
    console.error("❌ Error in /role/:id:", err);
    return res.status(500).json({ error: "Failed to retrieve role." });
  }
});

export default router;
