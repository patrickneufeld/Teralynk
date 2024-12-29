const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../services/adminService'); // Service to fetch users

// Middleware to verify admin access
const verifyAdmin = (req, res, next) => {
    const { userRole } = req.user || {};
    if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
};

// Get list of all users with pagination and filtering
router.get('/users', verifyAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;

        // Fetch users from service with pagination and optional search
        const users = await getAllUsers({ 
            page: parseInt(page), 
            limit: parseInt(limit), 
            search 
        });

        res.status(200).json({ 
            success: true, 
            message: 'List of all users retrieved successfully.', 
            data: users 
        });
    } catch (error) {
        console.error('Error retrieving users:', error);
        res.status(500).json({ error: 'An error occurred while retrieving users.' });
    }
});

module.exports = router;
