const express = require('express');
const router = express.Router();
const { linkAccount } = require('../services/externalIntegrationsService');

// Middleware to validate required fields in requests
const validateRequestBody = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ success: false, error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    next();
};

// **1️⃣ Link a user account to an external platform**
router.post(
    '/link-account',
    validateRequestBody(['userId', 'platform']),
    async (req, res) => {
        try {
            const { userId, platform } = req.body;

            // Validate platform
            const supportedPlatforms = ['google', 'facebook', 'github'];
            if (!supportedPlatforms.includes(platform)) {
                return res.status(400).json({
                    success: false,
                    error: `Unsupported platform. Supported platforms: ${supportedPlatforms.join(', ')}.`,
                });
            }

            // Call the service to link the account
            const result = await linkAccount(userId, platform);

            res.status(200).json({
                success: true,
                message: 'Account linked successfully.',
                data: result,
            });
        } catch (error) {
            console.error('Error linking account:', error);
            res.status(500).json({
                success: false,
                error: 'An internal error occurred while linking the account.',
            });
        }
    }
);

export default router;
