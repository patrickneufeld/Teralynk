const express = require('express');
const router = express.Router();
const {
    recordActivity,
    getLogs,
    clearLogs,
    deleteLogById,
    getActivityStats,
} = require('../services/activityLogService');

// Middleware to validate required fields in requests
const validateActivityInput = (req, res, next) => {
    const { userId, action, filePath } = req.body || {};
    if (!userId || !action || !filePath) {
        return res.status(400).json({ error: 'User ID, action, and file path are required.' });
    }
    next();
};

// Middleware to validate query parameters for GET requests
const validateQueryParams = (req, res, next) => {
    const { startDate, endDate } = req.query;
    if (startDate && isNaN(Date.parse(startDate))) {
        return res.status(400).json({ error: 'Invalid startDate format.' });
    }
    if (endDate && isNaN(Date.parse(endDate))) {
        return res.status(400).json({ error: 'Invalid endDate format.' });
    }
    next();
};

// Record a file activity
router.post('/record', validateActivityInput, async (req, res) => {
    try {
        const { userId, action, filePath, details = {} } = req.body;

        const activity = await recordActivity(userId, action, filePath, details);
        res.status(201).json({ message: 'Activity logged successfully.', activity });
    } catch (error) {
        console.error('Error recording activity:', error);
        res.status(500).json({ error: 'An error occurred while recording the activity.' });
    }
});

// Retrieve activity logs with filters and pagination
router.get('/logs', validateQueryParams, async (req, res) => {
    try {
        const { userId, filePath, action, startDate, endDate, page = 1, limit = 10 } = req.query;

        const filters = {
            userId,
            filePath,
            action,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        };

        const logs = await getLogs(filters, { page: parseInt(page), limit: parseInt(limit) });
        res.status(200).json({ logs });
    } catch (error) {
        console.error('Error retrieving logs:', error);
        res.status(500).json({ error: 'An error occurred while retrieving logs.' });
    }
});

// Retrieve activity statistics
router.get('/stats', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required to fetch statistics.' });
        }

        const stats = await getActivityStats(userId);
        res.status(200).json({ stats });
    } catch (error) {
        console.error('Error retrieving activity stats:', error);
        res.status(500).json({ error: 'An error occurred while retrieving activity stats.' });
    }
});

// Delete a specific activity log by ID with permission check
router.delete('/logs/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Log ID is required.' });
        }

        const result = await deleteLogById(id);
        if (result) {
            res.status(200).json({ message: 'Log deleted successfully.' });
        } else {
            res.status(404).json({ error: 'Log not found or permission denied.' });
        }
    } catch (error) {
        console.error('Error deleting log:', error);
        res.status(500).json({ error: 'An error occurred while deleting the log.' });
    }
});

// Clear all activity logs (admin-only operation)
router.delete('/clear', async (req, res) => {
    try {
        const response = await clearLogs();
        res.status(200).json(response);
    } catch (error) {
        console.error('Error clearing logs:', error);
        res.status(500).json({ error: 'An error occurred while clearing logs.' });
    }
});

module.exports = router;
