// ✅ FILE: backend/src/routes/adminRoutes.js

const express = require("express");
const { checkAdminAuth } = require("../middleware/authMiddleware");

// ✅ Import controllers
const adminController = require("../controllers/adminController");
const logController = require("../controllers/logController");

const router = express.Router();

// ✅ Debugging: Ensure all functions are properly loaded
if (process.env.NODE_ENV !== "production") {
    console.log("✅ Admin Controller Loaded Functions:", Object.keys(adminController));
    console.log("✅ Log Controller Loaded Functions:", Object.keys(logController));
}

// 🚨 Validate required functions before setting up routes
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
    "fetchMetrics"
];

const requiredLogFunctions = ["downloadLogs"];

const validateFunctions = (controller, requiredFunctions, controllerName) => {
    for (const fn of requiredFunctions) {
        if (typeof controller[fn] !== "function") {
            console.error(`🚨 ERROR: Function "${fn}" is missing or not a function in ${controllerName}!`);
            throw new Error(`🚨 Missing or invalid function: ${controllerName}.${fn}`);
        }
    }
};

try {
    validateFunctions(adminController, requiredAdminFunctions, "adminController");
    validateFunctions(logController, requiredLogFunctions, "logController");
} catch (error) {
    console.error(error.message);
    process.exit(1);
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