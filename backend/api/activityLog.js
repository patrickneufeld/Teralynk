// File: /backend/api/activityLog.js

const express = require('express');
const router = express.Router();
const { recordActivity, getLogs, clearLogs } = require('../services/activityLogService');

// Record a file activity
router.post('/record', async (req, res) => {
    try {
        const { userId, action, filePath, details = {} } = req.body;

        if (!userId || !action || !filePath) {
            return res.status(400).json({ error: 'User ID, action, and file path are required.' });
        }

        const activity = await recordActivity(userId, action, filePath, details);
        res.status(201).json({ message: 'Activity logged successfully.', activity });
    } catch (error) {
        console.error('Error recording activity:', error);
        res.status(500).json({ error: 'An error occurred while recording the activity.' });
    }
});

// Retrieve activity logs
router.get('/logs', async (req, res) => {
    try {
        const { userId, filePath, action } = req.query;

        const filters = { userId, filePath, action };
        const logs = await getLogs(filters);
        res.status(200).json({ logs });
    } catch (error) {
        console.error('Error retrieving logs:', error);
        res.status(500).json({ error: 'An error occurred while retrieving logs.' });
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
