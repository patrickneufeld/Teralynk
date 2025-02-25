// File Path: backend/api/adminRoutes.js

const express = require('express');
const router = express.Router();
const { getAllUsers, generateAdminInsights } = require('../services/adminService'); // Service to fetch users and insights
const { authenticate, authorize } = require('../middleware/authMiddleware'); // Middleware for authentication
const rateLimit = require('express-rate-limit');

// Rate limiter for admin routes
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per window
    message: 'Too many requests from this IP, please try again later.',
});

// Middleware to verify admin access
const verifyAdmin = (req, res, next) => {
    const { userRole } = req.user || {};
    if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
};

// Get list of all users with pagination, filtering, and AI-driven insights
router.get('/users', adminLimiter, authenticate, verifyAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;

        // Fetch users from the service with pagination and optional search
        const users = await getAllUsers({ 
            page: parseInt(page), 
            limit: parseInt(limit), 
            search 
        });

        // Generate AI insights for admin actions
        const insights = await generateAdminInsights(users);

        res.status(200).json({ 
            success: true, 
            message: 'List of all users retrieved successfully.', 
            data: users, 
            insights, // AI-driven insights
        });
    } catch (error) {
        console.error('Error retrieving users:', error);
        res.status(500).json({ error: 'An error occurred while retrieving users.' });
    }
});

module.exports = router;
