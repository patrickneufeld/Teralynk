// File: /backend/api/auditLog.js

const express = require('express');
const router = express.Router();
const { logAction, getLogs, clearLogs } = require('../services/auditLogService');

// Log an action
router.post('/log', async (req, res) => {
    try {
        const { userId, action, details } = req.body;

        if (!userId || !action) {
            return res.status(400).json({ error: 'User ID and action are required.' });
        }

        const logEntry = await logAction(userId, action, details);
        res.status(201).json({ message: 'Action logged successfully.', logEntry });
    } catch (error) {
        console.error('Error logging action:', error);
        res.status(500).json({ error: 'An error occurred while logging the action.' });
    }
});

// Retrieve audit logs
router.get('/logs', async (req, res) => {
    try {
        const filters = req.query; // Supports filters like userId, action, and timestamp
        const logs = await getLogs(filters);
        res.status(200).json({ logs });
    } catch (error) {
        console.error('Error retrieving logs:', error);
        res.status(500).json({ error: 'An error occurred while retrieving logs.' });
    }
});

// Clear audit logs
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
