// File Path: backend/api/sampleRoute.js

const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();

/**
 * POST /api/sample/create
 * Create a sample resource with input validation
 */
router.post(
    '/create',
    [
        body('name').isString().notEmpty().withMessage('Name is required and must be a string.'),
        body('email').isEmail().withMessage('A valid email is required.'),
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email } = req.body;
        res.status(201).json({
            success: true,
            message: 'Sample resource created successfully',
            data: { name, email },
        });
    }
);

/**
 * GET /api/sample/hello
 * Simple example endpoint to return a hello message
 */
router.get('/hello', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Hello from the sample route!',
    });
});

module.exports = router;
