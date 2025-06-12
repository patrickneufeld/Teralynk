// File Path: backend/controllers/collaborationAnalyticsController.js

const { recordNewSession, recordEdit, addUserToActiveUsers, removeUserFromActiveUsers, getMetrics, resetMetrics } = require('../services/collaborationMetricsService');

/**
 * Record a new collaboration session.
 * Endpoint: POST /api/collaboration/analytics/session
 */
const recordNewSessionHandler = async (req, res) => {
    try {
        recordNewSession();
        res.status(200).json({
            success: true,
            message: 'New collaboration session recorded successfully.',
        });
    } catch (error) {
        console.error('Error recording new session:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while recording the session.',
        });
    }
};

/**
 * Record an edit action in a collaboration session.
 * Endpoint: POST /api/collaboration/analytics/edit
 */
const recordEditHandler = async (req, res) => {
    try {
        recordEdit();
        res.status(200).json({
            success: true,
            message: 'Collaboration edit recorded successfully.',
        });
    } catch (error) {
        console.error('Error recording edit:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while recording the edit.',
        });
    }
};

/**
 * Add a user to the active users list in collaboration sessions.
 * Endpoint: POST /api/collaboration/analytics/active-user
 */
const addActiveUserHandler = async (req, res) => {
    try {
        const { userId } = req.body;
        addUserToActiveUsers(userId);
        res.status(200).json({
            success: true,
            message: `User ${userId} added to active users.`,
        });
    } catch (error) {
        console.error('Error adding active user:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while adding the user to active users.',
        });
    }
};

/**
 * Remove a user from the active users list in collaboration sessions.
 * Endpoint: POST /api/collaboration/analytics/active-user/remove
 */
const removeActiveUserHandler = async (req, res) => {
    try {
        const { userId } = req.body;
        removeUserFromActiveUsers(userId);
        res.status(200).json({
            success: true,
            message: `User ${userId} removed from active users.`,
        });
    } catch (error) {
        console.error('Error removing active user:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while removing the user from active users.',
        });
    }
};

/**
 * Get current collaboration metrics.
 * Endpoint: GET /api/collaboration/analytics/metrics
 */
const getAnalyticsHandler = async (req, res) => {
    try {
        const metricsData = getMetrics();
        res.status(200).json({
            success: true,
            message: 'Collaboration analytics retrieved successfully.',
            data: metricsData,
        });
    } catch (error) {
        console.error('Error retrieving collaboration analytics:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while retrieving collaboration analytics.',
        });
    }
};

/**
 * Reset all collaboration metrics.
 * Endpoint: POST /api/collaboration/analytics/metrics/reset
 */
const resetMetricsHandler = async (req, res) => {
    try {
        resetMetrics();
        res.status(200).json({
            success: true,
            message: 'Collaboration metrics reset successfully.',
        });
    } catch (error) {
        console.error('Error resetting collaboration metrics:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while resetting collaboration metrics.',
        });
    }
};

export {
    recordNewSessionHandler,
    recordEditHandler,
    addActiveUserHandler,
    removeActiveUserHandler,
    getAnalyticsHandler,
    resetMetricsHandler,
};
