// File Path: backend/api/contactRoutes.js

const express = require('express');
const { submitContactForm } = require('../controllers/contactController');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Middleware to validate required fields in the contact form
const validateContactForm = (req, res, next) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            error: 'Name, email, and message are required fields.',
        });
    }

    // Simple email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid email format.',
        });
    }

    next();
};

// Rate limiter to prevent spam submissions
const contactFormLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per window
    message: 'Too many contact form submissions from this IP, please try again later.',
});

// **Route: Submit Contact Form**
router.post(
    '/',
    contactFormLimiter, // Apply rate limiting
    validateContactForm, // Validate request body
    async (req, res) => {
        try {
            const { name, email, message } = req.body;

            const result = await submitContactForm(name, email, message);
            res.status(200).json({
                success: true,
                message: 'Contact form submitted successfully.',
                data: result,
            });
        } catch (error) {
            console.error('Error submitting contact form:', error);
            res.status(500).json({
                success: false,
                error: 'An error occurred while submitting the contact form.',
            });
        }
    }
);

module.exports = router;
