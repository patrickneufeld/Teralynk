const express = require('express');
const router = express.Router();
const { assignRole, getUserRoles } = require('../services/permissionsService');
const rbacMiddleware = require('../middleware/rbacMiddleware');

// Middleware to validate request body
const validateRequestBody = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ success: false, error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    next();
};

// **Assign a role to a user**
router.post('/assign-role', rbacMiddleware('admin'), validateRequestBody(['userId', 'role']), async (req, res) => {
    try {
        const { userId, role } = req.body;

        // Validate role (e.g., must be from a predefined set of roles)
        const validRoles = ['admin', 'user', 'moderator']; // Replace with your actual roles
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

// **Get roles for a user**
router.get('/user-roles', rbacMiddleware('admin'), async (req, res) => {
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

module.exports = router;
