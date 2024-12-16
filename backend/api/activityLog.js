// File: /backend/api/activityLog.js

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

// Retrieve activity logs with filters
router.get('/logs', async (req, res) => {
    try {
        const { userId, filePath, action, startDate, endDate } = req.query;

        const filters = {
            userId,
            filePath,
            action,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        };

        const logs = await getLogs(filters);
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
        const stats = await getActivityStats(userId);
        res.status(200).json({ stats });
    } catch (error) {
        console.error('Error retrieving activity stats:', error);
        res.status(500).json({ error: 'An error occurred while retrieving activity stats.' });
    }
});

// Delete a specific activity log by ID
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
            res.status(404).json({ error: 'Log not found.' });
        }
    } catch (error) {
        console.error('Error deleting log:', error);
        res.status(500).json({ error: 'An error occurred while deleting the log.' });
    }
});

// Clear all activity logs
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
