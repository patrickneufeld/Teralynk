// File Path: backend/src/api/docs.mjs

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json'); // Adjust the path if necessary
const rbacMiddleware = require('../middleware/rbacMiddleware'); // Role-based access control middleware
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Rate limiter for Swagger docs
const docsRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per window
    message: 'Too many requests to the docs. Please try again later.',
});

// Protect /docs with RBAC (only admins can access)
router.use('/docs', docsRateLimiter, rbacMiddleware('admin'), swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Optionally serve multiple versions of API docs
router.use('/docs/v1', docsRateLimiter, swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Add additional versions if needed
// router.use('/docs/v2', docsRateLimiter, swaggerUi.serve, swaggerUi.setup(swaggerV2Document));

module.exports = router;
