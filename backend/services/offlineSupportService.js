// File: /Users/patrick/Projects/Teralynk/backend/services/offlineSupportService.js

const fs = require('fs');
const path = require('path');
const { recordActivity } = require('./activityLogService');
const { hasPermission } = require('./rbacService');

// Directory to store offline changes
const OFFLINE_STORAGE_PATH = path.join(__dirname, '../../storage/offlineChanges');

// Ensure the offline storage directory exists
if (!fs.existsSync(OFFLINE_STORAGE_PATH)) {
    fs.mkdirSync(OFFLINE_STORAGE_PATH, { recursive: true });
}

// Save offline changes for a file
const saveOfflineChanges = async (userId, filePath, changes) => {
    if (!filePath || !userId || !changes) {
        throw new Error('File path, user ID, and changes are required.');
    }

    if (!hasPermission(userId, 'write')) {
        throw new Error('You do not have permission to save offline changes.');
    }

    const fileId = path.basename(filePath);
    const offlineFilePath = path.join(OFFLINE_STORAGE_PATH, `${fileId}_${userId}.json`);

    const offlineData = {
        filePath,
        userId,
        changes,
        timestamp: new Date(),
    };

    fs.writeFileSync(offlineFilePath, JSON.stringify(offlineData, null, 2));

    // Log activity
    await recordActivity(userId, 'saveOfflineChanges', filePath, { changes });

    console.log(`Offline changes saved for file: ${filePath}`);
    return offlineData;
};

// Sync offline changes to the cloud
const syncOfflineChanges = async (userId, cloudSyncFunction) => {
    if (!userId) {
        throw new Error('User ID is required for syncing offline changes.');
    }

    const offlineFiles = fs.readdirSync(OFFLINE_STORAGE_PATH).filter((file) =>
        file.includes(`_${userId}.json`)
    );

    const syncResults = [];

    for (const file of offlineFiles) {
        const filePath = path.join(OFFLINE_STORAGE_PATH, file);
        const offlineData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        try {
            await cloudSyncFunction(offlineData.filePath, offlineData.changes);

            // Remove the offline file after successful sync
            fs.unlinkSync(filePath);

            syncResults.push({ filePath: offlineData.filePath, status: 'synced' });
            console.log(`Offline changes synced for file: ${offlineData.filePath}`);
        } catch (error) {
            console.error(`Error syncing offline changes for file: ${offlineData.filePath}`, error);
            syncResults.push({ filePath: offlineData.filePath, status: 'failed', error });
        }
    }

    return syncResults;
};

// Retrieve offline changes for a user
const getOfflineChanges = async (userId) => {
    if (!userId) {
        throw new Error('User ID is required to retrieve offline changes.');
    }

    const offlineFiles = fs.readdirSync(OFFLINE_STORAGE_PATH).filter((file) =>
        file.includes(`_${userId}.json`)
    );

    const offlineChanges = offlineFiles.map((file) => {
        const filePath = path.join(OFFLINE_STORAGE_PATH, file);
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    });

    return offlineChanges;
};

module.exports = {
    saveOfflineChanges,
    syncOfflineChanges,
    getOfflineChanges,
};
