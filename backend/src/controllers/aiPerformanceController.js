// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/controllers/aiPerformanceController.js

import { logModelPerformance, getModelPerformanceLogs, getModelPerformanceStats } from "../services/aiPerformanceService.js";

// ✅ Log AI Model Performance
/**
 * @route   POST /api/ai/performance/log
 * @desc    Log AI model performance data (MSE, MAE, RSE)
 * @access  Private (requires authentication)
 */
export const logPerformance = async (req, res) => {
    try {
        const { modelId, mse, mae, rse } = req.body;
        const performanceData = await logModelPerformance(modelId, mse, mae, rse);
        res.status(201).json(performanceData);
    } catch (error) {
        console.error("❌ Error logging performance:", error);
        res.status(500).json({ error: "Failed to log performance data" });
    }
};

// ✅ Get AI Model Performance Logs
/**
 * @route   GET /api/ai/performance/logs/:modelId
 * @desc    Get the last 10 performance logs for a model
 * @access  Private (requires authentication)
 */
export const getPerformanceLogs = async (req, res) => {
    try {
        const { modelId } = req.params;
        const logs = await getModelPerformanceLogs(modelId);
        res.status(200).json(logs);
    } catch (error) {
        console.error("❌ Error fetching performance logs:", error);
        res.status(500).json({ error: "Failed to fetch performance logs" });
    }
};

// ✅ Get AI Model Performance Stats (Average MSE, MAE, RSE)
/**
 * @route   GET /api/ai/performance/stats/:modelId
 * @desc    Get average MSE, MAE, RSE for a model over a specified date range
 * @access  Private (requires authentication)
 */
export const getPerformanceStats = async (req, res) => {
    try {
        const { modelId } = req.params;
        const { startDate, endDate } = req.query;
        const stats = await getModelPerformanceStats(modelId, startDate, endDate);
        res.status(200).json(stats);
    } catch (error) {
        console.error("❌ Error fetching performance stats:", error);
        res.status(500).json({ error: "Failed to fetch performance stats" });
    }
};
