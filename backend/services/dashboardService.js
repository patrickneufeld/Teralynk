const { getUserStorageUsage, getSystemStorageUsage } = require('./storageAnalyticsService');
const { getUserActivityLogs } = require('./activityLogService');
const { getFileSyncStatus } = require('./fileSyncService');
const { getAIInsightsForUser } = require('./aiInsightsService');
const { getSystemErrorLogs } = require('./errorLogService');

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
            getAIInsightsForUser(userId)
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

// **Helper function to get active users count (can be expanded to include more system-level data)**
const getActiveUsersCount = async () => {
    try {
        // Simulating a query to count active users (can connect to Redis, DB, or an activity log)
        const activeUsers = await query('SELECT COUNT(*) FROM users WHERE is_active = true');
        return activeUsers.rows[0].count;
    } catch (error) {
        console.error('Error retrieving active users count:', error);
        return 0; // Return 0 if error occurs
    }
};

module.exports = {
    getUserDashboardData,
    getAdminDashboardData
};
