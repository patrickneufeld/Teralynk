// File: /backend/api/dashboard.js

const express = require('express');
const router = express.Router();
const {
    getUserDashboardData,
    getAdminDashboardData,
    getSystemMetrics,
    getRecentActivityLogs,
    getUserActivitySummary
} = require('../services/dashboardService');
const rbacMiddleware = require('../middleware/rbacMiddleware');

// Middleware to validate query parameters
const validateQueryParams = (requiredParams) => (req, res, next) => {
    const missingParams = requiredParams.filter(param => !req.query[param]);
    if (missingParams.length > 0) {
        return res.status(400).json({ error: `Missing required query params: ${missingParams.join(', ')}` });
    }
    next();
};

// **1️⃣ User-specific dashboard data**
router.get('/user', rbacMiddleware('user'), validateQueryParams(['userId']), async (req, res) => {
    try {
        const { userId } = req.query;

        const dashboardData = await getUserDashboardData(userId);
        res.status(200).json({ message: 'User dashboard data retrieved successfully.', dashboardData });
    } catch (error) {
        console.error('Error retrieving user dashboard data:', error);
        res.status(500).json({ error: 'An error occurred while retrieving user dashboard data.' });
    }
});

// **2️⃣ Admin-specific dashboard data**
router.get('/admin', rbacMiddleware('admin'), validateQueryParams(['adminId']), async (req, res) => {
    try {
        const { adminId } = req.query;

        const dashboardData = await getAdminDashboardData(adminId);
        res.status(200).json({ message: 'Admin dashboard data retrieved successfully.', dashboardData });
    } catch (error) {
        console.error('Error retrieving admin dashboard data:', error);
        res.status(500).json({ error: 'An error occurred while retrieving admin dashboard data.' });
    }
});

// **3️⃣ System Metrics (Admin Only)**
router.get('/metrics', rbacMiddleware('admin'), async (req, res) => {
    try {
        const metrics = await getSystemMetrics();
        res.status(200).json({ message: 'System metrics retrieved successfully.', metrics });
    } catch (error) {
        console.error('Error retrieving system metrics:', error);
        res.status(500).json({ error: 'An error occurred while retrieving system metrics.' });
    }
});

// **4️⃣ Recent Activity Logs**
router.get('/recent-activity', rbacMiddleware('user'), async (req, res) => {
    try {
        const { userId, limit = 10 } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required.' });
        }

        const activityLogs = await getRecentActivityLogs(userId, limit);
        res.status(200).json({ message: 'Recent activity logs retrieved successfully.', activityLogs });
    } catch (error) {
        console.error('Error retrieving recent activity logs:', error);
        res.status(500).json({ error: 'An error occurred while retrieving recent activity logs.' });
    }
});

// **5️⃣ User Activity Summary**
router.get('/user-summary', rbacMiddleware('user'), validateQueryParams(['userId']), async (req, res) => {
    try {
        const { userId } = req.query;

        const activitySummary = await getUserActivitySummary(userId);
        res.status(200).json({ message: 'User activity summary retrieved successfully.', activitySummary });
    } catch (error) {
        console.error('Error retrieving user activity summary:', error);
        res.status(500).json({ error: 'An error occurred while retrieving user activity summary.' });
    }
});

module.exports = router;
