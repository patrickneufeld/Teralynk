// File Path: backend/src/api/healthCheck.mjs

const express = require('express');
const router = express.Router();

// Simulated service health check functions
const checkDatabase = async () => {
    // Replace with actual DB connectivity check logic
    return { connected: true, latency: '12ms' };
};

const checkExternalServices = async () => {
    // Simulated external service checks (replace with real checks if needed)
    return { aiService: 'operational', externalAPI: 'operational' };
};

// Restrict access using RBAC or API tokens
const rbacMiddleware = require('../middleware/rbacMiddleware');

// **Health Check Endpoint**
router.get('/health', rbacMiddleware('admin'), async (req, res) => {
    try {
        const memoryUsage = process.memoryUsage();
        const databaseCheck = await checkDatabase();
        const externalServices = await checkExternalServices();

        res.status(200).json({
            success: true,
            message: 'System is healthy.',
            data: {
                status: 'Healthy',
                uptime: process.uptime(),
                timestamp: new Date(),
                memoryUsage: {
                    rss: memoryUsage.rss,
                    heapTotal: memoryUsage.heapTotal,
                    heapUsed: memoryUsage.heapUsed,
                    external: memoryUsage.external,
                },
                environment: process.env.NODE_ENV || 'development',
                database: databaseCheck,
                services: externalServices,
            },
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            success: false,
            error: 'Health check failed.',
        });
    }
});

module.exports = router;
