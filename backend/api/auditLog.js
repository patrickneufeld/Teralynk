// File: /backend/api/auditLog.js

const express = require('express');
const router = express.Router();
const {
    logAction,
    getLogs,
    clearLogs,
    deleteLogById,
    getAuditSummary,
} = require('../services/auditLogService');
const privacyMiddleware = require('../middleware/privacyMiddleware');

// Middleware to validate required fields in requests
const validateRequestBody = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    next();
};

// **1️⃣ Log an action**
router.post('/log', privacyMiddleware('user'), validateRequestBody(['userId', 'action']), async (req, res) => {
    try {
        const { userId, action, details = {} } = req.body;

        const logEntry = await logAction(userId, action, details);
        res.status(201).json({ message: 'Action logged successfully.', logEntry });
    } catch (error) {
        console.error('Error logging action:', error);
        res.status(500).json({ error: 'An error occurred while logging the action.' });
    }
});

// **2️⃣ Retrieve audit logs**
router.get('/logs', privacyMiddleware('admin'), async (req, res) => {
    try {
        const { userId, action, startDate, endDate } = req.query;

        const filters = {
            userId,
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

// **3️⃣ Get audit log summary**
router.get('/summary', privacyMiddleware('admin'), async (req, res) => {
    try {
        const summary = await getAuditSummary();
        res.status(200).json({ message: 'Audit summary retrieved successfully.', summary });
    } catch (error) {
        console.error('Error retrieving audit summary:', error);
        res.status(500).json({ error: 'An error occurred while retrieving the audit summary.' });
    }
});

// **4️⃣ Delete a specific audit log by ID**
router.delete('/logs/:id', privacyMiddleware('admin'), async (req, res) => {
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

// **5️⃣ Clear all audit logs**
router.delete('/clear', privacyMiddleware('admin'), async (req, res) => {
    try {
        const response = await clearLogs();
        res.status(200).json(response);
    } catch (error) {
        console.error('Error clearing logs:', error);
        res.status(500).json({ error: 'An error occurred while clearing logs.' });
    }
});

module.exports = router;
