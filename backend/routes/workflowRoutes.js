// File Path: backend/routes/workflowRoutes.js

const express = require('express');
const router = express.Router();
const workflowApiRouter = require('../api/workflows'); // Import all workflow APIs
const rateLimit = require('express-rate-limit');
const { authenticateUser } = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

// Rate limiter for workflow routes
const workflowRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per window
    message: 'Too many requests to workflow routes. Please try again later.',
});

// Middleware: Apply authentication and RBAC to all workflow routes
router.use('/workflows', workflowRateLimiter, authenticateUser, rbacMiddleware('user'));

// Mount the workflow API routes
router.use('/workflows', workflowApiRouter);

// Fallback for unhandled routes
router.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Workflow route not found.',
    });
});

module.exports = router;
