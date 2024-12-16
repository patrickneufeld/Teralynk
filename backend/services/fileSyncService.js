const fs = require('fs').promises; // Use async fs methods
const path = require('path');
const { saveFileVersion, detectAndResolveConflicts } = require('./versioningService');
const { logActivity } = require('./activityLogService');
const { sendNotification } = require('./notificationService');
const { query } = require('./db'); // Database integration

// Sync a file across devices or platforms
const syncFile = async (filePath, userId, changes) => {
    try {
        // Check if the file exists asynchronously
        const fileExists = await fs.stat(filePath).catch(() => false);
        if (!fileExists) {
            throw new Error(`File does not exist: ${filePath}`);
        }

        // Save a new version of the file
        const newVersion = await saveFileVersion(filePath, userId, changes);

        // Log the sync activity
        await logActivity(userId, filePath, 'sync', { changes });

        // Update sync status in database (replace in-memory store)
        await updateSyncState(filePath, { status: 'synced', lastSynced: new Date() });

        console.log(`File synced successfully: ${filePath}`);
        return newVersion;
    } catch (error) {
        console.error('Error syncing file:', error);
        throw new Error('Failed to sync file');
    }
};

// Detect and resolve conflicts during file sync
const resolveFileConflicts = async (filePath, userId, userChanges) => {
    try {
        // Detect conflicts based on user changes
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
    } catch (error) {
        console.error('Error resolving file conflict:', error);
        throw new Error('Failed to resolve file conflicts');
    }
};

// Get file sync status (from database instead of in-memory store)
const getSyncStatus = async (filePath) => {
    try {
        const result = await query(
            'SELECT * FROM file_sync_status WHERE file_path = $1',
            [filePath]
        );

        if (result.rows.length === 0) {
            return { status: 'idle', lastSynced: null };
        }

        return result.rows[0];
    } catch (error) {
        console.error('Error retrieving sync status:', error);
        throw new Error('Failed to retrieve file sync status');
    }
};

// Update file sync state in the database (instead of in-memory store)
const updateSyncState = async (filePath, state) => {
    try {
        const existingStatus = await getSyncStatus(filePath);

        if (existingStatus.status !== 'synced') {
            await query(
                'INSERT INTO file_sync_status (file_path, status, last_synced) VALUES ($1, $2, $3) ON CONFLICT (file_path) DO UPDATE SET status = $2, last_synced = $3',
                [filePath, state.status, state.lastSynced]
            );
            console.log(`File sync state updated: ${filePath}`, state);
        }

        return { status: state.status, lastSynced: state.lastSynced };
    } catch (error) {
        console.error('Error updating sync state:', error);
        throw new Error('Failed to update sync state');
    }
};

module.exports = {
    syncFile,
    resolveFileConflicts,
    getSyncStatus,
    updateSyncState,
};
