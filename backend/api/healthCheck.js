// File: /backend/api/healthCheck.js

const express = require('express');
const router = express.Router();

router.get('/health', async (req, res) => {
    try {
        res.status(200).json({ 
            status: 'Healthy', 
            uptime: process.uptime(), 
            timestamp: new Date() 
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({ error: 'Health check failed.' });
    }
});

module.exports = router;
