// File: /backend/api/permissions.js

const express = require('express');
const router = express.Router();
const { assignRole, getUserRoles } = require('../services/permissionsService');
const rbacMiddleware = require('../middleware/rbacMiddleware');

// **Assign a role to a user**
router.post('/assign-role', rbacMiddleware('admin'), async (req, res) => {
    try {
        const { userId, role } = req.body;

        if (!userId || !role) {
            return res.status(400).json({ error: 'User ID and role are required.' });
        }

        const response = await assignRole(userId, role);
        res.status(200).json({ message: 'Role assigned successfully.', response });
    } catch (error) {
        console.error('Error assigning role:', error);
        res.status(500).json({ error: 'An error occurred while assigning the role.' });
    }
});

// **Get roles for a user**
router.get('/user-roles', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required.' });
        }

        const roles = await getUserRoles(userId);
        res.status(200).json({ roles });
    } catch (error) {
        console.error('Error fetching user roles:', error);
        res.status(500).json({ error: 'An error occurred while retrieving user roles.' });
    }
});

module.exports = router;
