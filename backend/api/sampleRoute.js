// File Path: backend/api/sampleRoute.js

const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { authenticateUser } = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

const router = express.Router();

// Rate limiter for sample endpoints
const sampleRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per window
    message: 'Too many requests to the sample route. Please try again later.',
});

/**
 * POST /api/sample/create
 * Create a sample resource with input validation
 */
router.post(
    '/create',
    sampleRateLimiter,
    authenticateUser,
    rbacMiddleware('user'),
    [
        body('name')
            .isString()
            .notEmpty()
            .withMessage('Name is required and must be a string.'),
        body('email')
            .isEmail()
            .withMessage('A valid email is required.'),
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }

        const { name, email } = req.body;
        res.status(201).json({
            success: true,
            message: 'Sample resource created successfully.',
            data: { name, email },
        });
    }
);

/**
 * GET /api/sample/hello
 * Simple example endpoint to return a hello message
 */
router.get(
    '/hello',
    sampleRateLimiter,
    (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Hello from the sample route!',
        });
    }
);

/**
 * DELETE /api/sample/delete
 * Example endpoint to delete a resource (mocked for demonstration)
 */
router.delete(
    '/delete',
    sampleRateLimiter,
    authenticateUser,
    rbacMiddleware('admin'),
    [
        body('id')
            .isUUID()
            .withMessage('A valid resource ID is required.'),
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
            });
        }

        const { id } = req.body;

        // Mock deletion logic
        res.status(200).json({
            success: true,
            message: `Resource with ID ${id} deleted successfully.`,
        });
    }
);

module.exports = router;
