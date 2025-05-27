// File: /backend/services/dashboardService.js

const { getUserStorageUsage, getSystemStorageUsage } = require('./storageAnalyticsService');
const { getUserActivityLogs } = require('./activityLogService');
const { getFileSyncStatus } = require('./fileSyncService');
const { getAIInsightsForQuery } = require('./aiInsightsService');
const { getSystemErrorLogs } = require('./errorLogService');
const { query } = require('./db');

// **Generate a user-specific dashboard summary**
const getUserDashboardData = async (userId) => {
    if (!userId) {
        throw new Error('User ID is required to retrieve dashboard data.');
    }

    try {
        // Run async queries in parallel using Promise.all
        const [storageUsage, activityLogs, syncStatus, aiInsights] = await Promise.all([
            getUserStorageUsage(userId),
            getUserActivityLogs(userId),
            getFileSyncStatus(userId),
            getAIInsightsForQuery('dashboard', userId)
        ]);

        const dashboardData = {
            storageUsage,
            recentActivity: activityLogs.slice(-5), // Last 5 activity logs
            fileSyncStatus: syncStatus,
            aiInsights,
            lastRefresh: new Date()
        };

        console.log(`Dashboard data generated for user: ${userId}`);
        return dashboardData;
    } catch (error) {
        console.error('Error generating user dashboard data:', error.message);
        throw new Error('Unable to generate user dashboard data.');
    }
};

// **Generate an admin dashboard summary**
const getAdminDashboardData = async (adminId) => {
    if (!adminId) {
        throw new Error('Admin ID is required to retrieve dashboard data.');
    }

    try {
        // Run async queries in parallel using Promise.all
        const [systemStorageUsage, activeUsers, systemErrorLogs] = await Promise.all([
            getSystemStorageUsage(),
            getActiveUsersCount(),
            getSystemErrorLogs()
        ]);

        const adminDashboardData = {
            systemStorageUsage,
            activeUsers,
            systemErrors: systemErrorLogs.slice(-10), // Show the 10 most recent errors
            lastRefresh: new Date()
        };

        console.log(`Admin dashboard data generated for admin: ${adminId}`);
        return adminDashboardData;
    } catch (error) {
        console.error('Error generating admin dashboard data:', error.message);
        throw new Error('Unable to generate admin dashboard data.');
    }
};

// **Helper function to get active users count**
const getActiveUsersCount = async () => {
    try {
        const activeUsers = await query('SELECT COUNT(*) AS count FROM users WHERE is_active = true');
        return parseInt(activeUsers.rows[0].count, 10);
    } catch (error) {
        console.error('Error retrieving active users count:', error);
        return 0; // Return 0 if error occurs
    }
};

// **System Metrics (Admin Only)**
const getSystemMetrics = async () => {
    try {
        const [storageUsage, activeUsers] = await Promise.all([
            getSystemStorageUsage(),
            getActiveUsersCount()
        ]);

        const metrics = {
            systemStorageUsage: storageUsage,
            activeUsers,
            lastUpdated: new Date()
        };

        console.log('System metrics generated successfully.');
        return metrics;
    } catch (error) {
        console.error('Error generating system metrics:', error.message);
        throw new Error('Unable to generate system metrics.');
    }
};

// **Retrieve Recent Activity Logs**
const getRecentActivityLogs = async (userId, limit = 10) => {
    try {
        const activityLogs = await getUserActivityLogs(userId);
        return activityLogs.slice(-limit);
    } catch (error) {
        console.error('Error retrieving recent activity logs:', error.message);
        throw new Error('Unable to retrieve recent activity logs.');
    }
};

// **Get User Activity Summary**
const getUserActivitySummary = async (userId) => {
    if (!userId) {
        throw new Error('User ID is required to retrieve activity summary.');
    }

    try {
        const [storageUsage, activityLogs] = await Promise.all([
            getUserStorageUsage(userId),
            getUserActivityLogs(userId)
        ]);

        const summary = {
            storageUsage,
            totalActivities: activityLogs.length,
            recentActivity: activityLogs.slice(-5),
            lastUpdated: new Date()
        };

        console.log(`Activity summary generated for user: ${userId}`);
        return summary;
    } catch (error) {
        console.error('Error generating activity summary:', error.message);
        throw new Error('Unable to generate activity summary.');
    }
};

module.exports = {
    getUserDashboardData,
    getAdminDashboardData,
    getSystemMetrics,
    getRecentActivityLogs,
    getUserActivitySummary
};
