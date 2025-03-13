// File: /Users/patrick/Projects/Teralynk/backend/src/controllers/adminController.js

import pkg from "pg";
const { Client } = pkg;

import logger from "../config/logger.js";
import os from "os";

// Database Connection Setup
const dbClient = new Client({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  ssl: { rejectUnauthorized: false },
});

dbClient.connect().catch(err => {
  logger.error("❌ PostgreSQL Connection Error:", err.message);
  process.exit(1);
});

// Centralized Error Handler
const handleError = (res, error, message) => {
  logger.error(`❌ ${message}:`, error.message);
  res.status(500).json({ error: message, details: error.message });
};

// Validate ID
const validateId = (id, res) => {
  if (!id || isNaN(Number(id)) || Number(id) <= 0 || !Number.isInteger(Number(id))) {
    res.status(400).json({ error: "Invalid or missing 'id' parameter" });
    return false;
  }
  return true;
};

// Routes

export const fetchAIOptimizations = async (req, res) => {
  try {
    const result = await dbClient.query("SELECT * FROM ai_optimizations ORDER BY created_at DESC");
    res.json({ data: result.rows });
  } catch (error) {
    handleError(res, error, "Failed to fetch AI optimizations");
  }
};

export const approveOptimization = async (req, res) => {
  const { id } = req.body;
  if (!validateId(id, res)) return;

  try {
    const result = await dbClient.query(
      "UPDATE ai_optimizations SET approved = true WHERE id = $1 RETURNING *",
      [Number(id)]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Optimization not found" });
    }
    res.json({ message: "Optimization approved", optimization: result.rows[0] });
  } catch (error) {
    handleError(res, error, "Error approving optimization");
  }
};

export const rejectOptimization = async (req, res) => {
  const { id } = req.body;
  if (!validateId(id, res)) return;

  try {
    const result = await dbClient.query(
      "UPDATE ai_optimizations SET approved = false WHERE id = $1 RETURNING *",
      [Number(id)]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Optimization not found" });
    }
    res.json({ message: "Optimization rejected", optimization: result.rows[0] });
  } catch (error) {
    handleError(res, error, "Failed to reject optimization");
  }
};

export const deleteOptimization = async (req, res) => {
  const { id } = req.params;
  if (!validateId(id, res)) return;

  try {
    const result = await dbClient.query(
      "DELETE FROM ai_optimizations WHERE id = $1 RETURNING *",
      [Number(id)]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Optimization not found" });
    }
    res.json({ message: "Optimization deleted successfully" });
  } catch (error) {
    handleError(res, error, "Error deleting optimization");
  }
};

export const fetchAILogs = async (req, res) => {
  try {
    const result = await dbClient.query("SELECT * FROM ai_logs ORDER BY created_at DESC");
    res.json({ logs: result.rows });
  } catch (error) {
    handleError(res, error, "Failed to fetch AI logs");
  }
};

export const fetchLatestAILogs = async (req, res) => {
  try {
    const result = await dbClient.query("SELECT * FROM ai_logs ORDER BY created_at DESC LIMIT 10");
    res.json({ logs: result.rows });
  } catch (error) {
    handleError(res, error, "Failed to fetch latest AI logs");
  }
};

export const fetchUsers = async (req, res) => {
  try {
    const result = await dbClient.query("SELECT * FROM users ORDER BY created_at DESC");
    res.json({ users: result.rows });
  } catch (error) {
    handleError(res, error, "Failed to fetch users");
  }
};

export const disableUser = async (req, res) => {
  const { id } = req.body;
  if (!validateId(id, res)) return;

  try {
    const result = await dbClient.query(
      "UPDATE users SET is_active = false WHERE id = $1 RETURNING *",
      [Number(id)]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User disabled", user: result.rows[0] });
  } catch (error) {
    handleError(res, error, "Failed to disable user");
  }
};

export const enableUser = async (req, res) => {
  const { id } = req.body;
  if (!validateId(id, res)) return;

  try {
    const result = await dbClient.query(
      "UPDATE users SET is_active = true WHERE id = $1 RETURNING *",
      [Number(id)]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User enabled", user: result.rows[0] });
  } catch (error) {
    handleError(res, error, "Failed to enable user");
  }
};

export const fetchSystemStatus = async (req, res) => {
  try {
    const status = {
      uptime: process.uptime(),
      cpuLoad: os.loadavg(),
      memoryUsage: process.memoryUsage(),
      dbStatus: dbClient._connected ? "Connected" : "Disconnected",
      timestamp: new Date(),
    };
    res.json({ systemStatus: status });
  } catch (error) {
    handleError(res, error, "Failed to fetch system status");
  }
};

export const fetchMetrics = async (req, res) => {
  try {
    const [userCount, optimizationCount, logCount] = await Promise.all([
      dbClient.query("SELECT COUNT(*) FROM users"),
      dbClient.query("SELECT COUNT(*) FROM ai_optimizations"),
      dbClient.query("SELECT COUNT(*) FROM ai_logs"),
    ]);
    res.json({
      metrics: {
        totalUsers: parseInt(userCount.rows[0].count, 10),
        totalOptimizations: parseInt(optimizationCount.rows[0].count, 10),
        totalLogs: parseInt(logCount.rows[0].count, 10),
      },
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch metrics");
  }
};
