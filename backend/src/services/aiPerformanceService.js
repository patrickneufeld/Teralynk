// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/services/aiPerformanceService.js

import { AIModelPerformance } from "../models/aiPerformanceModel.js"; // Assuming you have a Mongoose model for storing AI performance logs
import { getCurrentTimestamp } from "../utils/dateUtils.js"; // Utility to get a formatted timestamp (for logging purposes)

/**
 * ✅ Log AI Model Performance (MSE, MAE, RSE)
 * @param {string} modelId - The AI model's unique ID
 * @param {number} mse - The Mean Squared Error
 * @param {number} mae - The Mean Absolute Error
 * @param {number} rse - The Root Squared Error
 * @returns {Promise<Object>} - The saved performance log
 */
export const logModelPerformance = async (modelId, mse, mae, rse) => {
    try {
        const performanceData = new AIModelPerformance({
            modelId,
            mse,
            mae,
            rse,
            timestamp: getCurrentTimestamp(), // Use utility to format current timestamp
        });

        const savedPerformance = await performanceData.save();
        return savedPerformance;
    } catch (error) {
        console.error("❌ Error logging AI performance:", error);
        throw new Error("Failed to log AI performance.");
    }
};

/**
 * ✅ Fetch AI Model Performance Logs
 * @param {string} modelId - The AI model's unique ID
 * @param {number} limit - Number of records to fetch
 * @returns {Promise<Array>} - The AI model's performance logs
 */
export const getModelPerformanceLogs = async (modelId, limit = 10) => {
    try {
        const logs = await AIModelPerformance.find({ modelId })
            .sort({ timestamp: -1 }) // Sort by most recent first
            .limit(limit);
        return logs;
    } catch (error) {
        console.error("❌ Error fetching AI performance logs:", error);
        throw new Error("Failed to retrieve AI performance logs.");
    }
};

/**
 * ✅ Get AI Model Performance Over Time (Average MSE, MAE, RSE)
 * @param {string} modelId - The AI model's unique ID
 * @param {string} startDate - Start date for performance calculation
 * @param {string} endDate - End date for performance calculation
 * @returns {Promise<Object>} - Average MSE, MAE, RSE over the given period
 */
export const getModelPerformanceStats = async (modelId, startDate, endDate) => {
    try {
        const stats = await AIModelPerformance.aggregate([
            {
                $match: {
                    modelId,
                    timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) },
                },
            },
            {
                $group: {
                    _id: "$modelId",
                    avgMse: { $avg: "$mse" },
                    avgMae: { $avg: "$mae" },
                    avgRse: { $avg: "$rse" },
                },
            },
        ]);
        return stats.length > 0 ? stats[0] : null; // Return the first result if any, else null
    } catch (error) {
        console.error("❌ Error fetching AI performance stats:", error);
        throw new Error("Failed to retrieve AI performance statistics.");
    }
};
