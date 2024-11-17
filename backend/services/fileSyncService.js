// File: /backend/services/fileSyncService.js

const fs = require('fs');
const path = require('path');
const { saveFileVersion, detectAndResolveConflicts } = require('./versioningService');
const { logActivity } = require('./activityLogService');
const { sendNotification } = require('./notificationService');

// In-memory store for file sync states (replace with a database for production)
const fileSyncStates = {};

// Sync a file across devices or platforms
const syncFile = async (filePath, userId, changes) => {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
    }

    // Save a new version of the file
    const newVersion = await saveFileVersion(filePath, userId, changes);

    // Log the sync activity
    await logActivity(userId, filePath, 'sync', { changes });

    console.log(`File synced successfully: ${filePath}`);
    return newVersion;
};

// Detect and resolve conflicts during file sync
const resolveFileConflicts = async (filePath, userId, userChanges) => {
    const conflictData = await detectAndResolveConflicts(filePath, userChanges);

    if (conflictData.conflict) {
        console.log(`Conflict detected for file: ${filePath}`);
        // Send notification to user about the conflict
        await sendNotification(userId, {
            type: 'conflict',
            message: `Conflict detected for file: ${path.basename(filePath)}`,
            data: { conflictData },
        });
    }

    return conflictData;
};

// Get file sync status
const getSyncStatus = (filePath) => {
    return fileSyncStates[filePath] || { status: 'idle', lastSynced: null };
};

// Update file sync state
const updateSyncState = (filePath, state) => {
    fileSyncStates[filePath] = { ...fileSyncStates[filePath], ...state };
    console.log(`File sync state updated: ${filePath}`, state);
    return fileSyncStates[filePath];
};

module.exports = {
    syncFile,
    resolveFileConflicts,
    getSyncStatus,
    updateSyncState,
};
