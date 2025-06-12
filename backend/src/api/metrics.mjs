// File Path: backend/src/api/metrics.mjs

const express = require('express');
const {
    getGlobalAnalytics,
    getActiveSessionsAnalytics,
    getSessionAnalytics,
    analyzeMetrics, // AI-driven insights
} = require('../services/analyticsService');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiter for metrics endpoints
const metricsRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per window
    message: 'Too many requests to the metrics service. Please try again later.',
});

// **1️⃣ Get global metrics**
router.get('/global', metricsRateLimiter, rbacMiddleware('admin'), async (req, res) => {
    try {
        const analytics = await getGlobalAnalytics();
        const insights = await analyzeMetrics(analytics); // AI-driven insights

        res.status(200).json({
            success: true,
            message: 'Global metrics retrieved successfully.',
            data: analytics,
            insights, // Include AI insights
        });
    } catch (error) {
        console.error('Error fetching global metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve global metrics.',
        });
    }
});

// **2️⃣ Get metrics for active sessions**
router.get('/active-sessions', metricsRateLimiter, rbacMiddleware('admin'), async (req, res) => {
    try {
        const analytics = await getActiveSessionsAnalytics();

        res.status(200).json({
            success: true,
            message: 'Active session metrics retrieved successfully.',
            data: analytics,
        });
    } catch (error) {
        console.error('Error fetching active session metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve active session metrics.',
        });
    }
});

// **3️⃣ Get metrics for a specific session**
router.get('/sessions/:id', metricsRateLimiter, rbacMiddleware('admin'), async (req, res) => {
    const { id: sessionId } = req.params;

    try {
        const analytics = await getSessionAnalytics(sessionId);

        res.status(200).json({
            success: true,
            message: `Metrics for session ${sessionId} retrieved successfully.`,
            data: analytics,
        });
    } catch (error) {
        console.error(`Error fetching metrics for session ${sessionId}:`, error);
        res.status(500).json({
            success: false,
            error: `Failed to retrieve metrics for session ${sessionId}.`,
        });
    }
});

module.exports = router;
