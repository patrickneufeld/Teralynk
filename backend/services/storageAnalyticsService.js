// File: /backend/services/storageAnalyticsService.js

const fs = require('fs').promises; // Use async fs methods
const path = require('path');
const { recordActivity } = require('./activityLogService');
const { hasPermission } = require('./rbacService');
const { query } = require('./db'); // Database integration for storing file metadata

const STORAGE_BASE_PATH = path.join(__dirname, '../../storage');

// **Fetch storage usage for a specific user**
const getUserStorageUsage = async (userId) => {
    if (!userId) {
        throw new Error('User ID is required to fetch storage usage.');
    }

    if (!(await hasPermission(userId, 'read'))) {
        throw new Error('You do not have permission to view storage analytics.');
    }

    const userStoragePath = path.join(STORAGE_BASE_PATH, userId);

    try {
        const stats = await fs.stat(userStoragePath).catch(() => false);
        if (!stats) {
            return { totalSize: 0, fileCount: 0 };
        }

        const { totalSize, fileCount } = await calculateUsage(userStoragePath);

        // Log activity
        await recordActivity(userId, 'getUserStorageUsage', null, { totalSize, fileCount });

        return { totalSize, fileCount };
    } catch (error) {
        console.error('Error fetching user storage usage:', error.message);
        throw new Error('Failed to fetch user storage usage.');
    }
};

// **Fetch system-wide storage usage**
const getSystemStorageUsage = async (adminId) => {
    if (!adminId || !(await hasPermission(adminId, 'admin'))) {
        throw new Error('Admin permissions are required to fetch system storage analytics.');
    }

    try {
        const { totalSize, fileCount } = await calculateUsage(STORAGE_BASE_PATH);

        // Log activity
        await recordActivity(adminId, 'getSystemStorageUsage', null, { totalSize, fileCount });

        return { totalSize, fileCount };
    } catch (error) {
        console.error('Error fetching system storage usage:', error.message);
        throw new Error('Failed to fetch system storage usage.');
    }
};

// **Generate storage analytics report for a user**
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

// **Helper function to calculate storage usage recursively in a directory**
const calculateUsage = async (directory) => {
    let totalSize = 0;
    let fileCount = 0;

    const items = await fs.readdir(directory);

    for (const item of items) {
        const itemPath = path.join(directory, item);
        const stats = await fs.stat(itemPath);

        if (stats.isDirectory()) {
            const { totalSize: subTotal, fileCount: subFileCount } = await calculateUsage(itemPath);
            totalSize += subTotal;
            fileCount += subFileCount;
        } else if (stats.isFile()) {
            totalSize += stats.size;
            fileCount += 1;
        }
    }

    return { totalSize, fileCount };
};

// **Save file metadata to the database (for efficient querying and reporting)**
const saveFileMetadata = async (filePath) => {
    if (!filePath) {
        throw new Error('File path is required to save metadata.');
    }

    try {
        const stats = await fs.stat(filePath);
        const metadata = {
            filePath,
            fileName: path.basename(filePath),
            size: stats.size,
            createdAt: stats.birthtime,
            updatedAt: stats.mtime,
            fileType: path.extname(filePath).slice(1),
        };

        // Insert or update metadata in the database
        await query(
            `INSERT INTO file_metadata (file_path, file_name, size, created_at, updated_at, file_type) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             ON CONFLICT (file_path) 
             DO UPDATE SET size = $3, updated_at = $5`,
            [
                metadata.filePath,
                metadata.fileName,
                metadata.size,
                metadata.createdAt,
                metadata.updatedAt,
                metadata.fileType,
            ]
        );

        console.log(`File metadata saved for: ${filePath}`);
        return metadata;
    } catch (error) {
        console.error(`Error saving file metadata for: ${filePath}`, error.message);
        throw new Error('Failed to save file metadata.');
    }
};

module.exports = {
    getUserStorageUsage,
    getSystemStorageUsage,
    generateStorageReport,
    saveFileMetadata, // Export the save function for file metadata
};
