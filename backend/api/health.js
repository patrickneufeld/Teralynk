// File Path: backend/api/health.js

const express = require('express');
const router = express.Router();

/**
 * Health Check Endpoint
 * @route GET /api/health
 */
router.get('/', (req, res) => {
    res.status(200).json({
        status: 'OK',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
