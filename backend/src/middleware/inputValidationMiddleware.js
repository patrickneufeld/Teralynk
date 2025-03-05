// File Path: backend/middleware/inputValidationMiddleware.js

const { body, validationResult } = require('express-validator');

/**
 * Middleware for validating input data for API requests.
 * This middleware is reusable and customizable per route.
 */
const validateRequest = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        next();
    };
};

module.exports = validateRequest;

// File Path: backend/middleware/csrfMiddleware.js

import csurf from "csurf";

/**
 * Middleware for protecting against CSRF attacks.
 * Should be applied to routes requiring protection.
 */
const csrfProtection = csurf({ cookie: true });

module.exports = csrfProtection;

// File Path: backend/api/sampleRoute.js

import express from "express";
import validateRequest from "../middleware/inputValidationMiddleware";
import csrfProtection from "../middleware/csrfMiddleware";
const { body } = require('express-validator');

const router = express.Router();

// Define route with input validation and CSRF protection
router.post(
    '/create',
    csrfProtection,
    validateRequest([
        body('name').isString().withMessage('Name must be a string').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Invalid email format'),
    ]),
    (req, res) => {
        const { name, email } = req.body;
        res.status(201).send({ message: 'Resource created successfully', data: { name, email } });
    }
);

module.exports = router;
