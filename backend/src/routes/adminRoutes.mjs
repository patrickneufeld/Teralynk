// ================================================
// ✅ Admin Routes
// File: /backend/src/routes/adminRoutes.mjs
// ================================================

import express from "express";
import { requireAdmin } from "../middleware/authMiddleware.mjs";
import { validateRequestContext } from "../middleware/contextValidationMiddleware.mjs";
import { logInfo, logWarn, logError, logDebug, logTrace, logSecurityEvent } from "../utils/logger.mjs";

const router = express.Router();

let adminController = {};
let logController = {};

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
  "fetchAIPersonas",
  "fetchUserNamingHistory",
  "deletePersonaTemplate",
  "updatePersonaTemplate"
];

const requiredLogFunctions = [
  "exportLogsToCSV",
  "pruneOldLogs",
  "searchLogs"
];

function validateFunctions(controller, required, label) {
  for (const fn of required) {
    if (typeof controller[fn] !== "function") {
      logError(`❌ Missing function: ${label}.${fn}`);
      throw new Error(`Missing function: ${label}.${fn}`);
    }
  }
}

async function initializeAdminRoutes() {
  try {
    const adminModule = await import("../controllers/adminController.mjs");
    const logModule = await import("../controllers/logController.mjs");

    adminController = adminModule;
    logController = logModule;

    validateFunctions(adminController, requiredAdminFunctions, "adminController");
    validateFunctions(logController, requiredLogFunctions, "logController");

    logInfo("✅ Admin and Log controllers loaded");

    // AI Optimization
    router.get("/ai-optimizations", requireAdmin, validateRequestContext, adminController.fetchAIOptimizations);
    router.post("/ai-optimizations/approve", requireAdmin, validateRequestContext, adminController.approveOptimization);
    router.post("/ai-optimizations/reject", requireAdmin, validateRequestContext, adminController.rejectOptimization);
    router.delete("/ai-optimizations/:id", requireAdmin, validateRequestContext, adminController.deleteOptimization);

    // AI Logs
    router.get("/logs", requireAdmin, validateRequestContext, adminController.fetchAILogs);
    router.get("/logs/latest", requireAdmin, validateRequestContext, adminController.fetchLatestAILogs);
    router.get("/logs/export", requireAdmin, validateRequestContext, logController.exportLogsToCSV);
    router.delete("/logs/prune/:days", requireAdmin, validateRequestContext, logController.pruneOldLogs);
    router.post("/logs/search", requireAdmin, validateRequestContext, logController.searchLogs);

    // User Admin
    router.get("/users", requireAdmin, validateRequestContext, adminController.fetchUsers);
    router.post("/users/disable", requireAdmin, validateRequestContext, adminController.disableUser);
    router.post("/users/enable", requireAdmin, validateRequestContext, adminController.enableUser);

    // System & Metrics
    router.get("/system-status", requireAdmin, validateRequestContext, adminController.fetchSystemStatus);
    router.get("/metrics", requireAdmin, validateRequestContext, adminController.fetchMetrics);

    // Persona Management
    router.get("/ai-personas", requireAdmin, validateRequestContext, adminController.fetchAIPersonas);
    router.get("/ai-user-naming/:userId", requireAdmin, validateRequestContext, adminController.fetchUserNamingHistory);
    router.delete("/ai-persona-template", requireAdmin, validateRequestContext, adminController.deletePersonaTemplate);
    router.patch("/ai-persona-template", requireAdmin, validateRequestContext, adminController.updatePersonaTemplate);
  } catch (err) {
    logError("❌ Failed to load admin controller or log controller", {
      error: err.message,
      stack: err.stack
    });

    router.use("*", (req, res) => {
      logError("Admin route fallback activated", { path: req.originalUrl });
      res.status(500).json({
        error: "Admin routes unavailable",
        code: "ADMIN_API_LOAD_FAILURE"
      });
    });
  }
}

// Only auto-initialize if mounted as root module or LOAD_ALL_ROUTES is set
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain || process.env.LOAD_ALL_ROUTES === "true") {
  await initializeAdminRoutes();
}

export default router;
