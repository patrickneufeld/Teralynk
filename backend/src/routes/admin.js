// File: /backend/src/routes/adminRoutes.js

import express from "express";
import { requireAdmin } from "../middleware/authMiddleware.js";
import * as adminController from "../controllers/adminController.js";
import { downloadLogs } from "../controllers/logController.js";

const router = express.Router();

// ✅ Define required controller functions for validation
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

const requiredLogFunctions = ["downloadLogs"];

// ✅ Validate controller functions are implemented
const validateFunctions = (controller, requiredFunctions, controllerName) => {
  for (const fn of requiredFunctions) {
    if (typeof controller[fn] !== "function") {
      throw new Error(`❌ Missing or invalid function: ${controllerName}.${fn}`);
    }
  }
};

try {
  validateFunctions(adminController, requiredAdminFunctions, "adminController");
  validateFunctions({ downloadLogs }, requiredLogFunctions, "logController");
} catch (error) {
  console.error(`🚨 Route validation error:`, error.message);
  process.exit(1); // Exit to avoid running routes with missing handlers
}

// ✅ Admin Routes with middleware protection
router.get("/ai-optimizations", requireAdmin, adminController.fetchAIOptimizations);
router.post("/ai-optimizations/approve", requireAdmin, adminController.approveOptimization);
router.post("/ai-optimizations/reject", requireAdmin, adminController.rejectOptimization);
router.delete("/ai-optimizations/:id", requireAdmin, adminController.deleteOptimization);

router.get("/logs", requireAdmin, adminController.fetchAILogs);
router.get("/logs/latest", requireAdmin, adminController.fetchLatestAILogs);
router.get("/logs/download", requireAdmin, downloadLogs);

router.get("/users", requireAdmin, adminController.fetchUsers);
router.post("/users/disable", requireAdmin, adminController.disableUser);
router.post("/users/enable", requireAdmin, adminController.enableUser);

router.get("/system-status", requireAdmin, adminController.fetchSystemStatus);
router.get("/metrics", requireAdmin, adminController.fetchMetrics);

export default router;
