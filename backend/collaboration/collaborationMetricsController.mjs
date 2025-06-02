// File Path: backend/collaboration/collaborationMetricsController.js

const express = require('express');
const {
    recordNewSession,
    recordEdit,
    addUserToActiveUsers,
    removeUserFromActiveUsers,
    getMetrics,
    resetMetrics,
} = require('../services/metricsService');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

/**
 * 1️⃣ Record a new session (triggered when a new session starts)
 */
router.post('/new-session', authMiddleware, rbacMiddleware('admin'), async (req, res) => {
    try {
        recordNewSession();
        res.status(200).json({
            success: true,
            message: 'New session recorded successfully.',
        });
    } catch (error) {
        console.error('Error recording new session:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while recording the new session.',
            details: error.message,
        });
    }
});

/**
 * 2️⃣ Record an edit action during a collaboration session.
 */
router.post('/edit', authMiddleware, rbacMiddleware('user'), async (req, res) => {
    try {
        recordEdit();
        res.status(200).json({
            success: true,
            message: 'Edit recorded successfully.',
        });
    } catch (error) {
        console.error('Error recording edit action:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while recording the edit action.',
            details: error.message,
        });
    }
});

/**
 * 3️⃣ Add a user to active users.
 */
router.post('/active-users/add', authMiddleware, rbacMiddleware('user'), async (req, res) => {
    try {
        const { userId } = req.body;
        addUserToActiveUsers(userId);
        res.status(200).json({
            success: true,
            message: `User ${userId} added to active users.`,
        });
    } catch (error) {
        console.error('Error adding user to active users:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while adding the user to active users.',
            details: error.message,
        });
    }
});

/**
 * 4️⃣ Remove a user from active users.
 */
router.post('/active-users/remove', authMiddleware, rbacMiddleware('user'), async (req, res) => {
    try {
        const { userId } = req.body;
        removeUserFromActiveUsers(userId);
        res.status(200).json({
            success: true,
            message: `User ${userId} removed from active users.`,
        });
    } catch (error) {
        console.error('Error removing user from active users:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while removing the user from active users.',
            details: error.message,
        });
    }
});

/**
 * 5️⃣ Retrieve current metrics data.
 */
router.get('/metrics', authMiddleware, rbacMiddleware('admin'), async (req, res) => {
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

/**
 * 6️⃣ Reset all metrics.
 */
router.post('/reset', authMiddleware, rbacMiddleware('admin'), async (req, res) => {
    try {
        resetMetrics();
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

module.exports = router;
