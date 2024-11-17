// File: /Users/patrick/Projects/Teralynk/backend/services/dashboardService.js

const fs = require('fs');
const path = require('path');
const { getUserStorageUsage, getSystemStorageUsage } = require('./storageAnalyticsService');
const { getUserActivityLogs } = require('./activityLogService');

// Generate a user-specific dashboard summary
const getUserDashboardData = async (userId) => {
    if (!userId) {
        throw new Error('User ID is required to retrieve dashboard data.');
    }

    try {
        const storageUsage = await getUserStorageUsage(userId);
        const activityLogs = await getUserActivityLogs(userId);

        const dashboardData = {
            storageUsage,
            recentActivity: activityLogs.slice(-5), // Return the last 5 activities
            timestamp: new Date(),
        };

        console.log(`Dashboard data generated for user: ${userId}`);
        return dashboardData;
    } catch (error) {
        console.error('Error generating user dashboard data:', error);
        throw new Error('Unable to generate user dashboard data.');
    }
};

// Generate an admin dashboard summary
const getAdminDashboardData = async (adminId) => {
    if (!adminId) {
        throw new Error('Admin ID is required to retrieve dashboard data.');
    }

    try {
        const systemStorageUsage = await getSystemStorageUsage(adminId);
        const adminDashboardData = {
            systemStorageUsage,
            timestamp: new Date(),
        };

        console.log(`Admin dashboard data generated for admin: ${adminId}`);
        return adminDashboardData;
    } catch (error) {
        console.error('Error generating admin dashboard data:', error);
        throw new Error('Unable to generate admin dashboard data.');
    }
};

module.exports = {
    getUserDashboardData,
    getAdminDashboardData,
};
