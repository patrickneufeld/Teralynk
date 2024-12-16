const fs = require('fs').promises; // Use async fs methods
const path = require('path');
const { recordActivity } = require('./activityLogService');
const { hasPermission } = require('./rbacService');
const { query } = require('./db'); // Database integration or use message queue for cloud sync

// Directory to store offline changes (use a database for production)
const OFFLINE_STORAGE_PATH = path.join(__dirname, '../../storage/offlineChanges');

// Ensure the offline storage directory exists
const ensureOfflineStorageExists = async () => {
    try {
        await fs.mkdir(OFFLINE_STORAGE_PATH, { recursive: true });
    } catch (error) {
        console.error('Error creating offline storage directory:', error);
    }
};
ensureOfflineStorageExists();

// Save offline changes for a file
const saveOfflineChanges = async (userId, filePath, changes) => {
    if (!filePath || !userId || !changes) {
        throw new Error('File path, user ID, and changes are required.');
    }

    // Ensure user has write permission
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

    try {
        // Save offline data as a JSON file
        await fs.writeFile(offlineFilePath, JSON.stringify(offlineData, null, 2));

        // Log activity
        await recordActivity(userId, 'saveOfflineChanges', filePath, { changes });

        console.log(`Offline changes saved for file: ${filePath}`);
        return offlineData;
    } catch (error) {
        console.error('Error saving offline changes:', error);
        throw new Error('An error occurred while saving offline changes.');
    }
};

// Sync offline changes to the cloud
const syncOfflineChanges = async (userId, cloudSyncFunction) => {
    if (!userId) {
        throw new Error('User ID is required for syncing offline changes.');
    }

    try {
        const offlineFiles = await fs.readdir(OFFLINE_STORAGE_PATH);
        const userOfflineFiles = offlineFiles.filter((file) =>
            file.includes(`_${userId}.json`)
        );

        const syncResults = [];

        for (const file of userOfflineFiles) {
            const filePath = path.join(OFFLINE_STORAGE_PATH, file);
            const offlineData = JSON.parse(await fs.readFile(filePath, 'utf8'));

            try {
                // Sync the offline changes to the cloud (call the passed cloudSyncFunction)
                await cloudSyncFunction(offlineData.filePath, offlineData.changes);

                // Remove the offline file after successful sync
                await fs.unlink(filePath);

                syncResults.push({ filePath: offlineData.filePath, status: 'synced' });
                console.log(`Offline changes synced for file: ${offlineData.filePath}`);
            } catch (error) {
                console.error(`Error syncing offline changes for file: ${offlineData.filePath}`, error);
                syncResults.push({ filePath: offlineData.filePath, status: 'failed', error });
            }
        }

        return syncResults;
    } catch (error) {
        console.error('Error syncing offline changes:', error);
        throw new Error('An error occurred while syncing offline changes.');
    }
};

// Retrieve offline changes for a user
const getOfflineChanges = async (userId) => {
    if (!userId) {
        throw new Error('User ID is required to retrieve offline changes.');
    }

    try {
        const offlineFiles = await fs.readdir(OFFLINE_STORAGE_PATH);
        const userOfflineFiles = offlineFiles.filter((file) =>
            file.includes(`_${userId}.json`)
        );

        const offlineChanges = await Promise.all(userOfflineFiles.map(async (file) => {
            const filePath = path.join(OFFLINE_STORAGE_PATH, file);
            const fileData = await fs.readFile(filePath, 'utf8');
            return JSON.parse(fileData);
        }));

        return offlineChanges;
    } catch (error) {
        console.error('Error retrieving offline changes:', error);
        throw new Error('An error occurred while retrieving offline changes.');
    }
};

// Delete offline changes for a user
const deleteOfflineChanges = async (userId, filePath) => {
    try {
        const offlineFiles = await fs.readdir(OFFLINE_STORAGE_PATH);
        const filesToDelete = offlineFiles.filter((file) =>
            file.includes(`_${userId}.json`) && file.includes(path.basename(filePath))
        );

        if (filesToDelete.length === 0) {
            throw new Error(`No offline changes found for file: ${filePath}`);
        }

        for (const file of filesToDelete) {
            const filePathToDelete = path.join(OFFLINE_STORAGE_PATH, file);
            await fs.unlink(filePathToDelete);
        }

        console.log(`Offline changes deleted for file: ${filePath}`);
        return { message: `Offline changes deleted for file: ${filePath}` };
    } catch (error) {
        console.error('Error deleting offline changes:', error);
        throw new Error('An error occurred while deleting offline changes.');
    }
};

module.exports = {
    saveOfflineChanges,
    syncOfflineChanges,
    getOfflineChanges,
    deleteOfflineChanges,
};
