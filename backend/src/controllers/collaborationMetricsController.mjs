// File Path: backend/controllers/collaborationMetricsController.js

const { getAnalytics, resetAnalytics } = require('../services/collaborationAnalyticsService');

/**
 * Retrieve the current collaboration metrics.
 * Endpoint: GET /api/collaboration/metrics
 */
const getCollaborationMetrics = (req, res) => {
    try {
        const analyticsData = getAnalytics();
        res.status(200).json({
            success: true,
            message: 'Collaboration metrics retrieved successfully.',
            data: analyticsData,
        });
    } catch (error) {
        console.error('Error retrieving collaboration metrics:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while retrieving collaboration metrics.',
        });
    }
};

/**
 * Reset all collaboration metrics.
 * Endpoint: POST /api/collaboration/metrics/reset
 */
const resetCollaborationMetrics = (req, res) => {
    try {
        resetAnalytics();
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
    getCollaborationMetrics,
    resetCollaborationMetrics,
};
