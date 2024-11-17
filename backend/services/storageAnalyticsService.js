// File: /Users/patrick/Projects/Teralynk/backend/services/storageAnalyticsService.js

const fs = require('fs');
const path = require('path');
const { recordActivity } = require('./activityLogService');
const { hasPermission } = require('./rbacService');

// Directory for user storage data (update as needed)
const STORAGE_BASE_PATH = path.join(__dirname, '../../storage');

// Fetch storage usage for a specific user
const getUserStorageUsage = async (userId) => {
    if (!userId) {
        throw new Error('User ID is required to fetch storage usage.');
    }

    if (!hasPermission(userId, 'read')) {
        throw new Error('You do not have permission to view storage analytics.');
    }

    const userStoragePath = path.join(STORAGE_BASE_PATH, userId);

    if (!fs.existsSync(userStoragePath)) {
        return { totalSize: 0, fileCount: 0 };
    }

    let totalSize = 0;
    let fileCount = 0;

    const calculateUsage = (directory) => {
        const items = fs.readdirSync(directory);
        items.forEach((item) => {
            const itemPath = path.join(directory, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
                calculateUsage(itemPath);
            } else if (stats.isFile()) {
                totalSize += stats.size;
                fileCount += 1;
            }
        });
    };

    calculateUsage(userStoragePath);

    // Log activity
    await recordActivity(userId, 'getUserStorageUsage', null, { totalSize, fileCount });

    return { totalSize, fileCount };
};

// Fetch system-wide storage usage
const getSystemStorageUsage = async (adminId) => {
    if (!adminId || !hasPermission(adminId, 'admin')) {
        throw new Error('Admin permissions are required to fetch system storage analytics.');
    }

    let totalSize = 0;
    let fileCount = 0;

    const calculateUsage = (directory) => {
        const items = fs.readdirSync(directory);
        items.forEach((item) => {
            const itemPath = path.join(directory, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
                calculateUsage(itemPath);
            } else if (stats.isFile()) {
                totalSize += stats.size;
                fileCount += 1;
            }
        });
    };

    calculateUsage(STORAGE_BASE_PATH);

    // Log activity
    await recordActivity(adminId, 'getSystemStorageUsage', null, { totalSize, fileCount });

    return { totalSize, fileCount };
};

// Generate storage analytics report for a user
const generateStorageReport = async (userId) => {
    if (!userId) {
        throw new Error('User ID is required to generate a storage report.');
    }

    const { totalSize, fileCount } = await getUserStorageUsage(userId);

    const report = {
        userId,
        totalSize,
        fileCount,
        generatedAt: new Date(),
    };

    console.log(`Storage report generated for user: ${userId}`);
    return report;
};

module.exports = {
    getUserStorageUsage,
    getSystemStorageUsage,
    generateStorageReport,
};
