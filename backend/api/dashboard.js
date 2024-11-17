// File: /Users/patrick/Projects/Teralynk/backend/api/dashboard.js

const express = require('express');
const router = express.Router();
const {
    getUserDashboardData,
    getAdminDashboardData,
} = require('../services/dashboardService');
const rbacMiddleware = require('../middleware/rbacMiddleware');

// User-specific dashboard data
router.get('/user', rbacMiddleware('read'), async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required.' });
        }

        const dashboardData = await getUserDashboardData(userId);
        res.status(200).json({ message: 'User dashboard data retrieved successfully.', dashboardData });
    } catch (error) {
        console.error('Error retrieving user dashboard data:', error);
        res.status(500).json({ error: 'An error occurred while retrieving user dashboard data.' });
    }
});

// Admin-specific dashboard data
router.get('/admin', rbacMiddleware('admin'), async (req, res) => {
    try {
        const { adminId } = req.query;

        if (!adminId) {
            return res.status(400).json({ error: 'Admin ID is required.' });
        }

        const dashboardData = await getAdminDashboardData(adminId);
        res.status(200).json({ message: 'Admin dashboard data retrieved successfully.', dashboardData });
    } catch (error) {
        console.error('Error retrieving admin dashboard data:', error);
        res.status(500).json({ error: 'An error occurred while retrieving admin dashboard data.' });
    }
});

module.exports = router;
