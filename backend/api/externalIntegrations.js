// File: /backend/api/externalIntegrations.js

const express = require('express');
const router = express.Router();

router.post('/link-account', async (req, res) => {
    try {
        const { userId, platform } = req.body;

        if (!userId || !platform) {
            return res.status(400).json({ error: 'User ID and platform are required.' });
        }

        res.status(200).json({ message: 'Account linked successfully.' });
    } catch (error) {
        console.error('Error linking account:', error);
        res.status(500).json({ error: 'An error occurred while linking the account.' });
    }
});

module.exports = router;
