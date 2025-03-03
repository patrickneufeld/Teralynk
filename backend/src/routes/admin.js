import express from "express";
import { requireAdmin } from "../middleware/authMiddleware.js"; // Import the requireAdmin middleware correctly
import * as adminController from "../controllers/adminController.js"; // Use ES module import for adminController

const router = express.Router();

// 🚨 LOGGING TO CATCH ERRORS
console.log("✅ Loaded adminController:", adminController);
console.log("✅ Functions inside adminController:", Object.keys(adminController));

// 🚨 ENSURE ALL FUNCTIONS ARE VALID
const requiredFunctions = [
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

// 🚨 CHECK IF ALL FUNCTIONS EXIST IN adminController
requiredFunctions.forEach((fn) => {
    if (typeof adminController[fn] !== "function") {
        console.error(`❌ ERROR: ${fn} is MISSING or NOT a function!`);
        adminController[fn] = (req, res) => res.status(500).json({ error: `${fn} is missing!` });
    }
});

// ✅ ADD ROUTES
router.get("/ai-optimizations", requireAdmin, adminController.fetchAIOptimizations);
router.post("/ai-optimizations/approve", requireAdmin, adminController.approveOptimization);
router.post("/ai-optimizations/reject", requireAdmin, adminController.rejectOptimization);
router.delete("/ai-optimizations/:id", requireAdmin, adminController.deleteOptimization);

router.get("/ai-logs", requireAdmin, adminController.fetchAILogs);
router.get("/ai-logs/latest", requireAdmin, adminController.fetchLatestAILogs);

router.get("/users", requireAdmin, adminController.fetchUsers);
router.post("/users/disable", requireAdmin, adminController.disableUser);
router.post("/users/enable", requireAdmin, adminController.enableUser);

router.get("/system-status", requireAdmin, adminController.fetchSystemStatus);
router.get("/metrics", requireAdmin, adminController.fetchMetrics);

export default router;  // Use export default instead of module.exports
