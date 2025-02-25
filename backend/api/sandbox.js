// File Path: backend/api/sandbox.js

const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateUser } = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

const router = express.Router();

// Rate limiter for sandbox endpoints
const sandboxRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per window
    message: 'Too many requests to the sandbox. Please try again later.',
});

/**
 * POST /api/sandbox/test
 * Test endpoint for prototyping or simulating responses
 */
router.post(
    '/test',
    sandboxRateLimiter,
    authenticateUser, // Optional: Add authentication if required
    async (req, res) => {
        try {
            const { input, simulateError, simulateDelay } = req.body;

            if (simulateError) {
                throw new Error('Simulated error triggered.');
            }

            // Simulate processing delay if requested
            if (simulateDelay) {
                await new Promise((resolve) => setTimeout(resolve, simulateDelay));
            }

            const simulatedResult = `Processed: ${input}`;
            res.status(200).json({
                success: true,
                message: 'Sandbox test processed successfully.',
                data: { simulatedResult },
            });
        } catch (error) {
            console.error('Error in sandbox:', error);
            res.status(500).json({
                success: false,
                error: 'An error occurred in the sandbox.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
);

module.exports = router;
