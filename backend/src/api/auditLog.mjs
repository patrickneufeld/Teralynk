// File Path: backend/src/api/auditLogRoutes.mjs

const express = require('express');
const router = express.Router();
const {
    logAction,
    getLogs,
    clearLogs,
    deleteLogById,
    getAuditSummary,
    analyzeLogs, // AI-driven log analysis
} = require('../services/auditLogService');
const privacyMiddleware = require('../middleware/privacyMiddleware');
const rateLimit = require('express-rate-limit');

// Middleware to validate required fields in requests
const validateRequestBody = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    next();
};

// Middleware to validate query parameters
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

// Rate limiter for audit routes
const auditRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per window
    message: 'Too many requests from this IP, please try again later.',
});

// **1️⃣ Log an action**
router.post('/log', auditRateLimiter, privacyMiddleware('user'), validateRequestBody(['userId', 'action']), async (req, res) => {
    try {
        const { userId, action, details = {} } = req.body;

        const logEntry = await logAction(userId, action, details);
        res.status(201).json({ success: true, message: 'Action logged successfully.', data: logEntry });
    } catch (error) {
        console.error('Error logging action:', error);
        res.status(500).json({ success: false, error: 'An error occurred while logging the action.' });
    }
});

// **2️⃣ Retrieve audit logs with filters, pagination, and AI insights**
router.get('/logs', auditRateLimiter, privacyMiddleware('admin'), validateQueryParams, async (req, res) => {
    try {
        const { userId, action, startDate, endDate, page = 1, limit = 10 } = req.query;

        const filters = {
            userId,
            action,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        };

        const logs = await getLogs(filters, { page: parseInt(page), limit: parseInt(limit) });
        const insights = await analyzeLogs(logs); // AI-driven insights

        res.status(200).json({
            success: true,
            message: 'Audit logs retrieved successfully.',
            data: logs,
            insights, // Include AI insights
        });
    } catch (error) {
        console.error('Error retrieving logs:', error);
        res.status(500).json({ success: false, error: 'An error occurred while retrieving logs.' });
    }
});

// **3️⃣ Get audit log summary with AI-driven insights**
router.get('/summary', auditRateLimiter, privacyMiddleware('admin'), async (req, res) => {
    try {
        const summary = await getAuditSummary();

        if (!summary || summary.length === 0) {
            return res.status(404).json({ success: false, error: 'No audit data available.' });
        }

        const insights = await analyzeLogs(summary); // AI-driven analysis for summaries

        res.status(200).json({
            success: true,
            message: 'Audit summary retrieved successfully.',
            data: summary,
            insights, // Include AI insights
        });
    } catch (error) {
        console.error('Error retrieving audit summary:', error);
        res.status(500).json({ success: false, error: 'An error occurred while retrieving the audit summary.' });
    }
});

// **4️⃣ Delete a specific audit log by ID**
router.delete('/logs/:id', auditRateLimiter, privacyMiddleware('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, error: 'Log ID is required.' });
        }

        const result = await deleteLogById(id);
        if (result) {
            res.status(200).json({ success: true, message: 'Log deleted successfully.' });
        } else {
            res.status(404).json({ success: false, error: 'Log not found.' });
        }
    } catch (error) {
        console.error('Error deleting log:', error);
        res.status(500).json({ success: false, error: 'An error occurred while deleting the log.' });
    }
});

// **5️⃣ Clear all audit logs (admin-only)**
router.delete('/clear', auditRateLimiter, privacyMiddleware('admin'), async (req, res) => {
    try {
        const response = await clearLogs();

        // Log admin action for audit purposes
        await logAction(req.user.id, 'CLEAR_LOGS', { admin: req.user.id });

        res.status(200).json({ success: true, message: 'All audit logs cleared successfully.', data: response });
    } catch (error) {
        console.error('Error clearing logs:', error);
        res.status(500).json({ success: false, error: 'An error occurred while clearing logs.' });
    }
});

module.exports = router;
