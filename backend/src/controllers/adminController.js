import pkg from 'pg';
const { Client } = pkg;  // Correct way to destructure the `Client` from the `pg` package
import logger from "../config/logger.js";  // Add .js extension
import os from "os";  // Import for the OS module

// ✅ Initialize PostgreSQL Client
const dbClient = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false, require: true },
});

// ✅ Handle Database Connection Errors
dbClient.connect().catch(err => {
    console.error("❌ PostgreSQL Connection Error:", err.message);
    process.exit(1); // Stop execution if DB connection fails
});

// ✅ Helper Function: Error Handling
const handleError = (res, error, message) => {
    console.error(`❌ ${message}:`, error.message);
    res.status(500).json({ error: message, details: error.message });
};

// ✅ Validate Request ID
const validateId = (id, res) => {
    if (!id || isNaN(id)) {
        res.status(400).json({ error: "Invalid or missing 'id' parameter" });
        return false;
    }
    return true;
};

// ✅ Fetch AI Optimizations
const fetchAIOptimizations = async (req, res) => {
    try {
        const result = await dbClient.query("SELECT * FROM ai_optimizations ORDER BY created_at DESC");
        res.json({ data: result.rows });
    } catch (error) {
        handleError(res, error, "Failed to fetch AI optimizations");
    }
};

// ✅ Approve AI Optimization
const approveOptimization = async (req, res) => {
    const { id } = req.body;
    if (!validateId(id, res)) return;

    try {
        const result = await dbClient.query(
            "UPDATE ai_optimizations SET approved = true WHERE id = $1 RETURNING *",
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Optimization not found" });
        }
        res.json({ message: "Optimization approved", optimization: result.rows[0] });
    } catch (error) {
        handleError(res, error, "Error approving optimization");
    }
};

// ✅ Reject AI Optimization
const rejectOptimization = async (req, res) => {
    const { id } = req.body;
    if (!validateId(id, res)) return;

    try {
        const result = await dbClient.query(
            "UPDATE ai_optimizations SET approved = false WHERE id = $1 RETURNING *",
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Optimization not found" });
        }
        res.json({ message: "Optimization rejected", data: result.rows[0] });
    } catch (error) {
        handleError(res, error, "Failed to reject optimization");
    }
};

// ✅ Delete AI Optimization Request
const deleteOptimization = async (req, res) => {
    const { id } = req.params;
    if (!validateId(id, res)) return;

    try {
        const result = await dbClient.query(
            "DELETE FROM ai_optimizations WHERE id = $1 RETURNING *",
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Optimization not found" });
        }
        res.json({ message: "Optimization deleted successfully" });
    } catch (error) {
        handleError(res, error, "Error deleting optimization");
    }
};

// ✅ Fetch AI Logs
const fetchAILogs = async (req, res) => {
    try {
        const result = await dbClient.query("SELECT * FROM ai_logs ORDER BY created_at DESC");
        res.json({ logs: result.rows });
    } catch (error) {
        handleError(res, error, "Failed to fetch AI logs");
    }
};

// ✅ Fetch Latest AI Logs (10 entries)
const fetchLatestAILogs = async (req, res) => {
    try {
        const result = await dbClient.query("SELECT * FROM ai_logs ORDER BY created_at DESC LIMIT 10");
        res.json({ logs: result.rows });
    } catch (error) {
        handleError(res, error, "Failed to fetch latest AI logs");
    }
};

// ✅ Fetch All Users
const fetchUsers = async (req, res) => {
    try {
        const result = await dbClient.query("SELECT * FROM users ORDER BY created_at DESC");
        res.json({ users: result.rows });
    } catch (error) {
        handleError(res, error, "Failed to fetch users");
    }
};

// ✅ Disable User
const disableUser = async (req, res) => {
    const { id } = req.body;
    if (!validateId(id, res)) return;

    try {
        const result = await dbClient.query(
            "UPDATE users SET is_active = false WHERE id = $1 RETURNING *",
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({ message: "User disabled", user: result.rows[0] });
    } catch (error) {
        handleError(res, error, "Failed to disable user");
    }
};

// ✅ Enable User
const enableUser = async (req, res) => {
    const { id } = req.body;
    if (!validateId(id, res)) return;

    try {
        const result = await dbClient.query(
            "UPDATE users SET is_active = true WHERE id = $1 RETURNING *",
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({ message: "User enabled", user: result.rows[0] });
    } catch (error) {
        handleError(res, error, "Failed to enable user");
    }
};

// ✅ Fetch System Status
const fetchSystemStatus = async (req, res) => {
    try {
        const status = {
            uptime: process.uptime(),
            cpuLoad: os.loadavg(),
            memoryUsage: process.memoryUsage(),
            dbStatus: "Connected",
            timestamp: new Date(),
        };
        res.json({ systemStatus: status });
    } catch (error) {
        handleError(res, error, "Failed to fetch system status");
    }
};

// ✅ Fetch System Metrics
const fetchMetrics = async (req, res) => {
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

// ✅ Ensure all functions are exported
export {
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
};
