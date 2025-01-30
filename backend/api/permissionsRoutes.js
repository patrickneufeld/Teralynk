// File Path: backend/api/permissionsRoutes.js

const express = require('express');
const router = express.Router();
const { assignRole, getUserRoles } = require('../services/permissionsService');

// **Assign a role to a user**
router.post('/assign-role', async (req, res) => {
    try {
        const { userId, role } = req.body;
        const response = await assignRole(userId, role);
        res.status(200).json({ success: true, message: 'Role assigned successfully', data: response });
    } catch (error) {
        res.status(500).json({ success: false, error: 'An error occurred while assigning the role.' });
    }
});

// **Get roles for a specific user**
router.get('/user-roles', async (req, res) => {
    try {
        const { userId } = req.query;
        const roles = await getUserRoles(userId);
        res.status(200).json({ success: true, message: 'Roles retrieved successfully', data: roles });
    } catch (error) {
        res.status(500).json({ success: false, error: 'An error occurred while retrieving roles.' });
    }
});

module.exports = router;
