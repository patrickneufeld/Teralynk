// File Path: backend/src/api/health.mjs

const express = require('express');
const router = express.Router();
const { checkDatabaseConnection } = require('../services/healthService'); // Example health service for DB checks
const rbacMiddleware = require('../middleware/rbacMiddleware'); // Restrict access

/**
 * Health Check Endpoint
 * @route GET /api/health
 */
router.get('/', rbacMiddleware('admin'), async (req, res) => {
    try {
        // Check database connectivity
        const dbStatus = await checkDatabaseConnection();

        res.status(200).json({
            status: 'OK',
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
            metrics: {
                database: dbStatus ? 'connected' : 'disconnected',
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
            },
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'ERROR',
            message: 'Health check failed.',
            error: error.message,
        });
    }
});

module.exports = router;
