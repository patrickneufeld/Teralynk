// File Path: backend/src/api/permissions.mjs

const express = require('express');
const router = express.Router();
const {
    assignRole,
    getUserRoles,
    recommendRoles, // AI-driven role recommendations
} = require('../services/permissionsService');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const rateLimit = require('express-rate-limit');

// Middleware to validate request body
const validateRequestBody = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ success: false, error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    next();
};

// Rate limiter for permissions-related endpoints
const permissionsRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per window
    message: 'Too many requests to the permissions service. Please try again later.',
});

// **1️⃣ Assign a role to a user**
router.post('/assign-role', permissionsRateLimiter, rbacMiddleware('admin'), validateRequestBody(['userId', 'role']), async (req, res) => {
    try {
        const { userId, role } = req.body;

        // Validate role
        const validRoles = ['admin', 'user', 'moderator']; // Replace with actual roles
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                error: `Invalid role. Valid roles are: ${validRoles.join(', ')}`,
            });
        }

        const response = await assignRole(userId, role);
        res.status(200).json({
            success: true,
            message: 'Role assigned successfully.',
            data: response,
        });
    } catch (error) {
        console.error('Error assigning role:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while assigning the role.',
        });
    }
});

// **2️⃣ Get roles for a user**
router.get('/user-roles', permissionsRateLimiter, rbacMiddleware('admin'), async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required.',
            });
        }

        const roles = await getUserRoles(userId);
        res.status(200).json({
            success: true,
            message: 'User roles retrieved successfully.',
            data: roles,
        });
    } catch (error) {
        console.error('Error fetching user roles:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while retrieving user roles.',
        });
    }
});

// **3️⃣ Recommend roles for a user (AI-driven)**
router.get('/recommend-roles', permissionsRateLimiter, rbacMiddleware('admin'), async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required.',
            });
        }

        const recommendedRoles = await recommendRoles(userId); // AI-driven logic
        res.status(200).json({
            success: true,
            message: 'Recommended roles retrieved successfully.',
            data: recommendedRoles,
        });
    } catch (error) {
        console.error('Error recommending roles:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while recommending roles.',
        });
    }
});

module.exports = router;
