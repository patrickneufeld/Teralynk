// File: /backend/api/logs.js

const express = require('express');
const router = express.Router();

router.get('/logs', async (req, res) => {
    try {
        // Simulated log data
        const logs = [
            { timestamp: new Date(), message: 'Server started successfully.' },
            { timestamp: new Date(), message: 'Database connected successfully.' }
        ];
        res.status(200).json({ logs });
    } catch (error) {
        console.error('Error retrieving logs:', error);
        res.status(500).json({ error: 'An error occurred while retrieving logs.' });
    }
});

module.exports = router;
