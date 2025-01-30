const { validationResult } = require('express-validator');

/**
 * Handles contact form submissions.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const submitContactForm = async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        // Simulate saving to database or sending an email
        console.log(`Contact Form Submission: Name: ${name}, Email: ${email}, Message: ${message}`);

        // Respond with success
        res.status(200).json({
            success: true,
            message: 'Thank you for your message. We will get back to you soon.',
        });
    } catch (error) {
        console.error('Error handling contact form submission:', error);
        res.status(500).json({ error: 'An unexpected error occurred.' });
    }
};

module.exports = { submitContactForm };
