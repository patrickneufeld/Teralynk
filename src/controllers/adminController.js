// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/controllers/adminController.js

const AIOptimization = require("../models/AIOptimizationModel");
const User = require("../models/UserModel");
const Log = require("../models/LogModel");
const logger = require("../config/logger");
const os = require("os");

/**
 * Fetch AI Optimizations (Pending Review)
 */
const fetchAIOptimizations = async (req, res) => {
    try {
        const pendingOptimizations = await AIOptimization.find({ status: "pending" });
        res.json({ success: true, optimizations: pendingOptimizations });
    } catch (error) {
        logger.error("Error fetching AI optimizations:", error);
        res.status(500).json({ success: false, message: "Failed to fetch AI optimizations" });
    }
};

/**
 * Approve AI Optimization
 */
const approveOptimization = async (req, res) => {
    const { optimizationId, approvedBy } = req.body;
    if (!optimizationId) {
        return res.status(400).json({ success: false, message: "Optimization ID is required" });
    }
    try {
        const optimization = await AIOptimization.findById(optimizationId);
        if (!optimization) {
            return res.status(404).json({ success: false, message: "Optimization not found" });
        }

        optimization.status = "approved";
        optimization.approvedAt = new Date();
        optimization.approvedBy = approvedBy || req.user.id;
        await optimization.save();

        logger.info(`AI Optimization Approved: ${optimizationId} by Admin ${approvedBy || req.user.id}`);
        res.json({ success: true, message: "Optimization approved successfully" });
    } catch (error) {
        logger.error("Error approving AI optimization:", error);
        res.status(500).json({ success: false, message: "Failed to approve AI optimization" });
    }
};

/**
 * Reject AI Optimization
 */
const rejectOptimization = async (req, res) => {
    const { optimizationId, reason } = req.body;
    if (!optimizationId || !reason) {
        return res.status(400).json({ success: false, message: "Optimization ID and rejection reason are required" });
    }
    try {
        const optimization = await AIOptimization.findById(optimizationId);
        if (!optimization) {
            return res.status(404).json({ success: false, message: "Optimization not found" });
        }

        optimization.status = "rejected";
        optimization.rejectionReason = reason;
        await optimization.save();

        logger.info(`AI Optimization Rejected: ${optimizationId} - Reason: ${reason}`);
        res.json({ success: true, message: "Optimization rejected successfully" });
    } catch (error) {
        logger.error("Error rejecting AI optimization:", error);
        res.status(500).json({ success: false, message: "Failed to reject AI optimization" });
    }
};

/**
 * Delete AI Optimization Request
 */
const deleteOptimization = async (req, res) => {
    try {
        const { id } = req.params;
        const optimization = await AIOptimization.findByIdAndDelete(id);

        if (!optimization) {
            return res.status(404).json({ success: false, message: "Optimization not found" });
        }

        logger.info(`AI Optimization Deleted: ${id}`);
        res.json({ success: true, message: "Optimization deleted successfully" });
    } catch (error) {
        logger.error("Error deleting AI optimization:", error);
        res.status(500).json({ success: false, message: "Failed to delete AI optimization" });
    }
};

/**
 * Fetch AI Logs
 */
const fetchAILogs = async (req, res) => {
    try {
        const logs = await Log.find({});
        res.json({ success: true, logs });
    } catch (error) {
        logger.error("Error fetching AI logs:", error);
        res.status(500).json({ success: false, message: "Failed to fetch AI logs" });
    }
};

/**
 * Fetch Latest AI Logs
 */
const fetchLatestAILogs = async (req, res) => {
    try {
        const logs = await Log.find().sort({ createdAt: -1 }).limit(10);
        res.json({ success: true, logs });
    } catch (error) {
        logger.error("Error fetching latest AI logs:", error);
        res.status(500).json({ success: false, message: "Failed to fetch latest AI logs" });
    }
};

/**
 * Fetch All Users
 */
const fetchUsers = async (req, res) => {
    try {
        const users = await User.find({}).select("-password");
        res.json({ success: true, users });
    } catch (error) {
        logger.error("Error fetching users:", error);
        res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
};

/**
 * Disable User Account
 */
const disableUser = async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
    }
    try {
        const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        logger.info(`User Disabled: ${userId}`);
        res.json({ success: true, message: "User disabled successfully" });
    } catch (error) {
        logger.error("Error disabling user:", error);
        res.status(500).json({ success: false, message: "Failed to disable user" });
    }
};

/**
 * Enable User Account
 */
const enableUser = async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
    }
    try {
        const user = await User.findByIdAndUpdate(userId, { isActive: true }, { new: true });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        logger.info(`User Enabled: ${userId}`);
        res.json({ success: true, message: "User enabled successfully" });
    } catch (error) {
        logger.error("Error enabling user:", error);
        res.status(500).json({ success: false, message: "Failed to enable user" });
    }
};

/**
 * Fetch System Status
 */
const fetchSystemStatus = async (req, res) => {
    try {
        res.json({ success: true, status: "System is operational", timestamp: new Date() });
    } catch (error) {
        logger.error("Error fetching system status:", error);
        res.status(500).json({ success: false, message: "Failed to fetch system status" });
    }
};

/**
 * Fetch System Metrics
 */
const fetchMetrics = async (req, res) => {
    try {
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();
        const cpuUsage = os.loadavg();

        res.json({ 
            success: true, 
            metrics: { 
                uptime, 
                memoryUsage: {
                    rss: memoryUsage.rss,
                    heapTotal: memoryUsage.heapTotal,
                    heapUsed: memoryUsage.heapUsed,
                    external: memoryUsage.external
                },
                cpuLoad: {
                    "1min": cpuUsage[0],
                    "5min": cpuUsage[1],
                    "15min": cpuUsage[2]
                },
                timestamp: new Date()
            }
        });
    } catch (error) {
        logger.error("Error fetching system metrics:", error);
        res.status(500).json({ success: false, message: "Failed to fetch system metrics" });
    }
};

// ✅ THIS IS THE FINAL EXPORT. EVERY FUNCTION IS INCLUDED.
module.exports = {
    fetchAIOptimizations,
    approveOptimization,
    rejectOptimization,
    deleteOptimization,
    fetchAILogs, // ✅ FIXED: WAS MISSING
    fetchLatestAILogs, // ✅ FIXED: WAS MISSING
    fetchUsers,
    disableUser,
    enableUser,
    fetchSystemStatus,
    fetchMetrics
};
