// File Path: backend/api/dashboardRoutes.js

const express = require('express');
const {
    getUserData,
    getRecentFiles,
    generateUserInsights, // AI-driven user insights
} = require('../controllers/dashboardController');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Rate limiter for dashboard routes
const dashboardRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: 'Too many requests from this IP, please try again later.',
});

// **1️⃣ Get User Dashboard Data**
router.get('/user', dashboardRateLimiter, rbacMiddleware('user'), async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required.',
            });
        }

        const userData = await getUserData(userId);
        const insights = await generateUserInsights(userData); // AI-driven insights

        res.status(200).json({
            success: true,
            message: 'User dashboard data retrieved successfully.',
            data: userData,
            insights, // Include AI insights
        });
    } catch (error) {
        console.error('Error retrieving user data:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while retrieving user dashboard data.',
        });
    }
});

// **2️⃣ Get Recent Files**
router.get('/recent-files', dashboardRateLimiter, rbacMiddleware('user'), async (req, res) => {
    try {
        const { userId, page = 1, limit = 10 } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required.',
            });
        }

        const recentFiles = await getRecentFiles(userId, { page: parseInt(page), limit: parseInt(limit) });

        res.status(200).json({
            success: true,
            message: 'Recent files retrieved successfully.',
            data: recentFiles,
        });
    } catch (error) {
        console.error('Error retrieving recent files:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while retrieving recent files.',
        });
    }
});

module.exports = router;
