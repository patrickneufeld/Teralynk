// File: /backend/api/fileSync.js

const express = require('express');
const router = express.Router();
const {
    syncFile,
    resolveFileConflicts,
    getSyncStatus,
    updateSyncState,
} = require('../services/fileSyncService');

// Sync a file
router.post('/sync', async (req, res) => {
    try {
        const { filePath, userId, changes } = req.body;

        if (!filePath || !userId || !changes) {
            return res.status(400).json({ error: 'File path, user ID, and changes are required.' });
        }

        const syncResult = await syncFile(filePath, userId, changes);
        res.status(200).json({ message: 'File synced successfully.', syncResult });
    } catch (error) {
        console.error('Error syncing file:', error);
        res.status(500).json({ error: 'An error occurred while syncing the file.' });
    }
});

// Detect and resolve file conflicts
router.post('/resolve-conflicts', async (req, res) => {
    try {
        const { filePath, userId, userChanges } = req.body;

        if (!filePath || !userId || !userChanges) {
            return res.status(400).json({ error: 'File path, user ID, and user changes are required.' });
        }

        const conflictResolution = await resolveFileConflicts(filePath, userId, userChanges);
        res.status(200).json({ message: 'Conflict resolution completed.', conflictResolution });
    } catch (error) {
        console.error('Error resolving conflicts:', error);
        res.status(500).json({ error: 'An error occurred while resolving conflicts.' });
    }
});

// Get sync status for a file
router.get('/status', async (req, res) => {
    try {
        const { filePath } = req.query;

        if (!filePath) {
            return res.status(400).json({ error: 'File path is required.' });
        }

        const syncStatus = getSyncStatus(filePath);
        res.status(200).json({ syncStatus });
    } catch (error) {
        console.error('Error retrieving sync status:', error);
        res.status(500).json({ error: 'An error occurred while retrieving sync status.' });
    }
});

// Update sync state for a file
router.post('/update-state', async (req, res) => {
    try {
        const { filePath, state } = req.body;

        if (!filePath || !state) {
            return res.status(400).json({ error: 'File path and state are required.' });
        }

        const updatedState = updateSyncState(filePath, state);
        res.status(200).json({ message: 'File sync state updated.', updatedState });
    } catch (error) {
        console.error('Error updating sync state:', error);
        res.status(500).json({ error: 'An error occurred while updating sync state.' });
    }
});

module.exports = router;
