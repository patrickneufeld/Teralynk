// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/routes/aiPerformanceRoutes.js

import express from "express";
import { logPerformance, getPerformanceLogs, getPerformanceStats } from "../controllers/aiPerformanceController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Middleware to ensure authentication
router.use(requireAuth);

// ✅ Log AI model performance (MSE, MAE, RSE)
router.post("/log", logPerformance);

// ✅ Get the performance logs for a model
router.get("/logs/:modelId", getPerformanceLogs);

// ✅ Get average performance stats for a model over a time range
router.get("/stats/:modelId", getPerformanceStats);

export default router;
