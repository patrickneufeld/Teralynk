const express = require('express');
const router = express.Router();

// Simulate a database check function (replace with actual logic if needed)
const checkDatabase = async () => {
    return { connected: true, latency: '12ms' }; // Mock example
};

// **Health Check Endpoint**
router.get('/health', async (req, res) => {
    try {
        const memoryUsage = process.memoryUsage();
        const databaseCheck = await checkDatabase(); // Include additional checks if needed

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
