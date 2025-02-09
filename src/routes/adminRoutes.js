// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/routes/adminRoutes.js

const express = require("express");
const { checkAdminAuth } = require("../middleware/authMiddleware");

// ✅ Ensure controllers are correctly imported
const adminController = require("../controllers/adminController");
const logController = require("../controllers/logController");

const router = express.Router();

// ✅ Debugging: Verify function imports
console.log("✅ Admin Controller Loaded Functions:", Object.keys(adminController));
console.log("✅ Log Controller Loaded Functions:", Object.keys(logController));

// 🚨 Validate function existence before assigning routes
const requiredAdminFunctions = [
    "fetchAIOptimizations",
    "approveOptimization",
    "rejectOptimization",
    "deleteOptimization",
    "fetchAILogs",
    "fetchLatestAILogs",
    "fetchUsers",
    "disableUser",
    "enableUser",
    "fetchSystemStatus",
    "fetchMetrics",
];

for (const func of requiredAdminFunctions) {
    if (typeof adminController[func] !== "function") {
        throw new Error(`🚨 Missing required function in adminController.js: ${func}`);
    }
}

if (typeof logController.downloadLogs !== "function") {
    throw new Error(`🚨 Missing required function in logController.js: downloadLogs`);
}

/**
 * @route GET /api/admin/ai-optimizations
 * @desc Fetch pending AI optimizations
 * @access Admin only
 */
router.get("/ai-optimizations", checkAdminAuth, adminController.fetchAIOptimizations);

/**
 * @route POST /api/admin/ai-optimizations/approve
 * @desc Approve an AI optimization request
 * @access Admin only
 */
router.post("/ai-optimizations/approve", checkAdminAuth, adminController.approveOptimization);

/**
 * @route POST /api/admin/ai-optimizations/reject
 * @desc Reject an AI optimization request
 * @access Admin only
 */
router.post("/ai-optimizations/reject", checkAdminAuth, adminController.rejectOptimization);

/**
 * @route DELETE /api/admin/ai-optimizations/:id
 * @desc Delete an AI optimization request
 * @access Admin only
 */
router.delete("/ai-optimizations/:id", checkAdminAuth, adminController.deleteOptimization);

/**
 * @route GET /api/admin/logs
 * @desc Fetch AI logs for performance tracking
 * @access Admin only
 */
router.get("/logs", checkAdminAuth, adminController.fetchAILogs);

/**
 * @route GET /api/admin/logs/latest
 * @desc Fetch latest AI logs
 * @access Admin only
 */
router.get("/logs/latest", checkAdminAuth, adminController.fetchLatestAILogs);

/**
 * @route GET /api/admin/logs/download
 * @desc Download AI logs as CSV
 * @access Admin only
 */
router.get("/logs/download", checkAdminAuth, logController.downloadLogs);

/**
 * @route GET /api/admin/users
 * @desc Fetch all users
 * @access Admin only
 */
router.get("/users", checkAdminAuth, adminController.fetchUsers);

/**
 * @route POST /api/admin/users/disable
 * @desc Disable a user account
 * @access Admin only
 */
router.post("/users/disable", checkAdminAuth, adminController.disableUser);

/**
 * @route POST /api/admin/users/enable
 * @desc Enable a user account
 * @access Admin only
 */
router.post("/users/enable", checkAdminAuth, adminController.enableUser);

/**
 * @route GET /api/admin/system-status
 * @desc Fetch system health and status
 * @access Admin only
 */
router.get("/system-status", checkAdminAuth, adminController.fetchSystemStatus);

/**
 * @route GET /api/admin/metrics
 * @desc Fetch system metrics and AI performance
 * @access Admin only
 */
router.get("/metrics", checkAdminAuth, adminController.fetchMetrics);

module.exports = router;
