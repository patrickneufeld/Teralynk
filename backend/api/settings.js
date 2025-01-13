const express = require('express');
const router = express.Router();
const { getUserSettings, updateUserSettings } = require('../services/settingsService');
const rbacMiddleware = require('../middleware/rbacMiddleware');

// Middleware to validate request body
const validateRequestBody = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ success: false, error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    next();
};

// **1️⃣ Get user-specific settings**
router.get('/user-settings', rbacMiddleware('user'), async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required.',
            });
        }

        const settings = await getUserSettings(userId);
        res.status(200).json({
            success: true,
            message: 'User settings retrieved successfully.',
            data: settings,
        });
    } catch (error) {
        console.error('Error fetching user settings:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching user settings.',
            details: error.message,
        });
    }
});

// **2️⃣ Update user-specific settings**
router.post('/update-settings', rbacMiddleware('user'), validateRequestBody(['userId', 'settings']), async (req, res) => {
    try {
        const { userId, settings } = req.body;

        // Validate `settings` structure (example: ensure it's an object)
        if (typeof settings !== 'object' || Array.isArray(settings)) {
            return res.status(400).json({
                success: false,
                error: 'Settings must be a valid object.',
            });
        }

        const updatedSettings = await updateUserSettings(userId, settings);
        res.status(200).json({
            success: true,
            message: 'User settings updated successfully.',
            data: updatedSettings,
        });
    } catch (error) {
        console.error('Error updating user settings:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while updating user settings.',
            details: error.message,
        });
    }
});

module.exports = router;
