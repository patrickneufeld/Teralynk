// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/controllers/adminController.js

const { Client } = require("pg");
const logger = require("../config/logger");
const jwt = require("jsonwebtoken");
const os = require("os");
const process = require("process");

// ✅ Initialize PostgreSQL Client
const dbClient = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false, require: true },
});

dbClient.connect().catch(err => {
    console.error("❌ PostgreSQL Connection Error:", err.message);
});

// ✅ Helper Function: Log & Handle Errors
const handleError = (res, error, message) => {
    logger.error(`${message}:`, error);
    res.status(500).json({ message, error: error.message });
};

/**
 * ✅ Fetch AI Optimizations (Converted to PostgreSQL)
 */
const fetchAIOptimizations = async (req, res) => {
    try {
        const result = await dbClient.query("SELECT * FROM ai_optimizations ORDER BY created_at DESC");
        res.status(200).json({ message: "AI optimizations fetched successfully", data: result.rows });
    } catch (error) {
        handleError(res, error, "Error fetching AI optimizations");
    }
};

/**
 * ✅ Approve AI Optimization
 */
const approveOptimization = async (req, res) => {
    try {
        const { id } = req.body;
        const result = await dbClient.query(
            "UPDATE ai_optimizations SET approved = TRUE WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Optimization not found" });
        }

        res.status(200).json({ message: "Optimization approved successfully", data: result.rows[0] });
    } catch (error) {
        handleError(res, error, "Error approving optimization");
    }
};

/**
 * ✅ Reject AI Optimization
 */
const rejectOptimization = async (req, res) => {
    try {
        const { id } = req.body;
        const result = await dbClient.query(
            "UPDATE ai_optimizations SET approved = FALSE WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Optimization not found" });
        }

        res.status(200).json({ message: "Optimization rejected successfully", data: result.rows[0] });
    } catch (error) {
        handleError(res, error, "Error rejecting optimization");
    }
};

/**
 * ✅ Delete AI Optimization
 */
const deleteOptimization = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await dbClient.query("DELETE FROM ai_optimizations WHERE id = $1 RETURNING *", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Optimization not found" });
        }

        res.status(200).json({ message: "Optimization deleted successfully" });
    } catch (error) {
        handleError(res, error, "Error deleting optimization");
    }
};

/**
 * ✅ Fetch AI Logs (Converted to PostgreSQL)
 */
const fetchAILogs = async (req, res) => {
    try {
        const result = await dbClient.query("SELECT * FROM ai_logs ORDER BY created_at DESC");
        res.status(200).json({ message: "AI logs fetched successfully", data: result.rows });
    } catch (error) {
        handleError(res, error, "Error fetching AI logs");
    }
};

/**
 * ✅ Fetch Latest AI Logs (Limit 10)
 */
const fetchLatestAILogs = async (req, res) => {
    try {
        const result = await dbClient.query("SELECT * FROM ai_logs ORDER BY created_at DESC LIMIT 10");
        res.status(200).json({ message: "Latest AI logs fetched successfully", data: result.rows });
    } catch (error) {
        handleError(res, error, "Error fetching latest AI logs");
    }
};

/**
 * ✅ Fetch Users (Converted to PostgreSQL)
 */
const fetchUsers = async (req, res) => {
    try {
        const result = await dbClient.query("SELECT id, email, name, is_active FROM users ORDER BY created_at DESC");
        res.status(200).json({ message: "Users fetched successfully", data: result.rows });
    } catch (error) {
        handleError(res, error, "Error fetching users");
    }
};

/**
 * ✅ Disable User
 */
const disableUser = async (req, res) => {
    try {
        const { id } = req.body;
        const result = await dbClient.query("UPDATE users SET is_active = FALSE WHERE id = $1 RETURNING *", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User disabled successfully", data: result.rows[0] });
    } catch (error) {
        handleError(res, error, "Error disabling user");
    }
};

/**
 * ✅ Enable User
 */
const enableUser = async (req, res) => {
    try {
        const { id } = req.body;
        const result = await dbClient.query("UPDATE users SET is_active = TRUE WHERE id = $1 RETURNING *", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User enabled successfully", data: result.rows[0] });
    } catch (error) {
        handleError(res, error, "Error enabling user");
    }
};

/**
 * ✅ Fetch System Status
 */
const fetchSystemStatus = async (req, res) => {
    try {
        const systemStatus = {
            database: "Connected", // TODO: Implement real-time DB connection check
            cpuUsage: `${os.loadavg()[0].toFixed(2)}%`,
            memoryUsage: `${((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)}%`,
            uptime: process.uptime(),
        };

        res.status(200).json({ message: "System status fetched successfully", data: systemStatus });
    } catch (error) {
        handleError(res, error, "Error fetching system status");
    }
};

/**
 * ✅ Fetch AI & User Metrics
 */
const fetchMetrics = async (req, res) => {
    try {
        const [users, optimizations, logs] = await Promise.all([
            dbClient.query("SELECT COUNT(*) FROM users"),
            dbClient.query("SELECT COUNT(*) FROM ai_optimizations"),
            dbClient.query("SELECT COUNT(*) FROM ai_logs"),
        ]);

        const metrics = {
            totalUsers: parseInt(users.rows[0].count),
            totalAIOptimizations: parseInt(optimizations.rows[0].count),
            totalLogs: parseInt(logs.rows[0].count),
        };

        res.status(200).json({ message: "Metrics fetched successfully", data: metrics });
    } catch (error) {
        handleError(res, error, "Error fetching metrics");
    }
};

/**
 * ✅ Middleware: Ensure Admin Access
 */
const requireAdmin = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1] || req.cookies.token;
        if (!token) {
            return res.status(403).json({ message: "Access denied. No token provided." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid or expired token" });
    }
};

// ✅ Export all functions
module.exports = {
    fetchAIOptimizations,
    approveOptimization,
    rejectOptimization,
    deleteOptimization,
    fetchAILogs,
    fetchLatestAILogs,
    fetchUsers,
    disableUser,
    enableUser,
    fetchSystemStatus,
    fetchMetrics,
    requireAdmin,
};
