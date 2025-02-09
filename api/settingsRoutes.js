// File Path: backend/api/settingRoutes.js

const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Rate limiter for settings endpoints
const settingsRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per window
    message: 'Too many requests to the settings service. Please try again later.',
});

// Middleware to validate request body
const validateRequestBody = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ success: false, error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    next();
};

// **1️⃣ Get settings**
router.get(
    '/',
    settingsRateLimiter,
    rbacMiddleware('user'), // Allow only authenticated users
    async (req, res) => {
        try {
            const settings = await getSettings(req.user.id); // Pass the authenticated user ID
            res.status(200).json({
                success: true,
                message: 'Settings retrieved successfully.',
                data: settings,
            });
        } catch (error) {
            console.error('Error fetching settings:', error);
            res.status(500).json({
                success: false,
                error: 'An error occurred while fetching settings.',
            });
        }
    }
);

// **2️⃣ Update settings**
router.put(
    '/',
    settingsRateLimiter,
    rbacMiddleware('user'), // Allow only authenticated users
    validateRequestBody(['settings']), // Validate required fields
    async (req, res) => {
        try {
            const { settings } = req.body;

            // Validate settings structure (example: ensure it's an object)
            if (typeof settings !== 'object' || Array.isArray(settings)) {
                return res.status(400).json({
                    success: false,
                    error: 'Settings must be a valid object.',
                });
            }

            const updatedSettings = await updateSettings(req.user.id, settings); // Pass the authenticated user ID
            res.status(200).json({
                success: true,
                message: 'Settings updated successfully.',
                data: updatedSettings,
            });
        } catch (error) {
            console.error('Error updating settings:', error);
            res.status(500).json({
                success: false,
                error: 'An error occurred while updating settings.',
            });
        }
    }
);

module.exports = router;
