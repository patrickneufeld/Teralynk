// File Path: backend/collaboration/analyticsController.js

const express = require('express');
const {
    getMetrics,
    resetMetrics,
} = require('../services/metricsService');
const router = express.Router();
const rbacMiddleware = require('../middleware/rbacMiddleware');

// **1️⃣ Get collaboration metrics (e.g., active sessions, total edits)**
router.get('/metrics', rbacMiddleware('admin'), async (req, res) => {
    try {
        const metrics = await getMetrics();
        res.status(200).json({
            success: true,
            message: 'Metrics retrieved successfully.',
            data: metrics,
        });
    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching metrics.',
            details: error.message,
        });
    }
});

// **2️⃣ Reset all collaboration metrics**
router.post('/reset-metrics', rbacMiddleware('admin'), async (req, res) => {
    try {
        await resetMetrics();
        res.status(200).json({
            success: true,
            message: 'Metrics reset successfully.',
        });
    } catch (error) {
        console.error('Error resetting metrics:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while resetting metrics.',
            details: error.message,
        });
    }
});

// **3️⃣ Get active collaboration sessions count**
router.get('/active-sessions', rbacMiddleware('user'), async (req, res) => {
    try {
        const count = await getActiveSessionCount();
        res.status(200).json({
            success: true,
            message: 'Active session count retrieved successfully.',
            data: { count },
        });
    } catch (error) {
        console.error('Error fetching active session count:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching active session count.',
            details: error.message,
        });
    }
});

module.exports = router;
