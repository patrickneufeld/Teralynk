// File: /backend/api/settings.js

const express = require('express');
const router = express.Router();
const { getUserSettings, updateUserSettings } = require('../services/settingsService');

// **Get user-specific settings**
router.get('/user-settings', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required.' });
        }

        const settings = await getUserSettings(userId);
        res.status(200).json({ settings });
    } catch (error) {
        console.error('Error fetching user settings:', error);
        res.status(500).json({ error: 'An error occurred while fetching user settings.' });
    }
});

// **Update user-specific settings**
router.post('/update-settings', async (req, res) => {
    try {
        const { userId, settings } = req.body;

        if (!userId || !settings) {
            return res.status(400).json({ error: 'User ID and settings are required.' });
        }

        const response = await updateUserSettings(userId, settings);
        res.status(200).json({ message: 'User settings updated successfully.', response });
    } catch (error) {
        console.error('Error updating user settings:', error);
        res.status(500).json({ error: 'An error occurred while updating user settings.' });
    }
});

module.exports = router;
