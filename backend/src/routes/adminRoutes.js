import express from "express";
import { requireAdmin } from "../middleware/authMiddleware.js"; // Import admin middleware correctly
import * as adminController from "../controllers/adminController.js"; // Ensure correct named import
import { downloadLogs } from "../controllers/logController.js"; // ✅ Fix: Import `downloadLogs` correctly

const router = express.Router();

// ✅ Debugging: Ensure all functions are properly loaded
console.log("✅ Admin Controller Loaded Functions:", Object.keys(adminController));
console.log("✅ Log Controller Loaded Functions: [ 'downloadLogs' ]");

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
    validateFunctions({ downloadLogs }, requiredLogFunctions, "logController"); // ✅ Fix: Validate correctly
} catch (error) {
    console.error(error.message);
    process.exit(1);
}

/**
 * ✅ @route GET /api/admin/ai-optimizations
 * ✅ Fetch pending AI optimizations
 * ✅ Admin only
 */
router.get("/ai-optimizations", requireAdmin, adminController.fetchAIOptimizations);

/**
 * ✅ @route POST /api/admin/ai-optimizations/approve
 * ✅ Approve an AI optimization request
 * ✅ Admin only
 */
router.post("/ai-optimizations/approve", requireAdmin, adminController.approveOptimization);

/**
 * ✅ @route POST /api/admin/ai-optimizations/reject
 * ✅ Reject an AI optimization request
 * ✅ Admin only
 */
router.post("/ai-optimizations/reject", requireAdmin, adminController.rejectOptimization);

/**
 * ✅ @route DELETE /api/admin/ai-optimizations/:id
 * ✅ Delete an AI optimization request
 * ✅ Admin only
 */
router.delete("/ai-optimizations/:id", requireAdmin, adminController.deleteOptimization);

/**
 * ✅ @route GET /api/admin/logs
 * ✅ Fetch AI logs for performance tracking
 * ✅ Admin only
 */
router.get("/logs", requireAdmin, adminController.fetchAILogs);

/**
 * ✅ @route GET /api/admin/logs/latest
 * ✅ Fetch latest AI logs
 * ✅ Admin only
 */
router.get("/logs/latest", requireAdmin, adminController.fetchLatestAILogs);

/**
 * ✅ @route GET /api/admin/logs/download
 * ✅ Download AI logs as CSV
 * ✅ Admin only
 */
router.get("/logs/download", requireAdmin, downloadLogs); // ✅ Fix: Use named import correctly

/**
 * ✅ @route GET /api/admin/users
 * ✅ Fetch all users
 * ✅ Admin only
 */
router.get("/users", requireAdmin, adminController.fetchUsers);

/**
 * ✅ @route POST /api/admin/users/disable
 * ✅ Disable a user account
 * ✅ Admin only
 */
router.post("/users/disable", requireAdmin, adminController.disableUser);

/**
 * ✅ @route POST /api/admin/users/enable
 * ✅ Enable a user account
 * ✅ Admin only
 */
router.post("/users/enable", requireAdmin, adminController.enableUser);

/**
 * ✅ @route GET /api/admin/system-status
 * ✅ Fetch system health and status
 * ✅ Admin only
 */
router.get("/system-status", requireAdmin, adminController.fetchSystemStatus);

/**
 * ✅ @route GET /api/admin/metrics
 * ✅ Fetch system metrics and AI performance
 * ✅ Admin only
 */
router.get("/metrics", requireAdmin, adminController.fetchMetrics);

export default router; // ✅ Use ES module export
