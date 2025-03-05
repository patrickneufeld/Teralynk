import express from "express";
import { requireAdmin } from "../middleware/authMiddleware.js"; // Import the requireAdmin middleware correctly

const router = express.Router();

// ✅ Dynamically import adminController
const adminController = await import("../controllers/adminController.js");

// 🚨 LOGGING TO CATCH ERRORS
console.log("✅ Loaded adminController:", adminController.default);
console.log("✅ Functions inside adminController:", Object.keys(adminController.default));

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
    if (typeof adminController.default[fn] !== "function") {
        console.error(`❌ ERROR: ${fn} is MISSING or NOT a function!`);
        adminController.default[fn] = (req, res) => res.status(500).json({ error: `${fn} is missing!` });
    }
});

// ✅ ADD ROUTES
router.get("/ai-optimizations", requireAdmin, adminController.default.fetchAIOptimizations);
router.post("/ai-optimizations/approve", requireAdmin, adminController.default.approveOptimization);
router.post("/ai-optimizations/reject", requireAdmin, adminController.default.rejectOptimization);
router.delete("/ai-optimizations/:id", requireAdmin, adminController.default.deleteOptimization);

router.get("/ai-logs", requireAdmin, adminController.default.fetchAILogs);
router.get("/ai-logs/latest", requireAdmin, adminController.default.fetchLatestAILogs);

router.get("/users", requireAdmin, adminController.default.fetchUsers);
router.post("/users/disable", requireAdmin, adminController.default.disableUser);
router.post("/users/enable", requireAdmin, adminController.default.enableUser);

router.get("/system-status", requireAdmin, adminController.default.fetchSystemStatus);
router.get("/metrics", requireAdmin, adminController.default.fetchMetrics);

export default router;  // Use export default instead of module.exports
