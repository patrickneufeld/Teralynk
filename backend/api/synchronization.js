// File: /backend/api/synchronization.js

const express = require('express');
const router = express.Router();
const {
    queueFileForSync,
    processSyncQueue,
    syncOfflineChanges,
} = require('../services/synchronizationService');

// Queue a file for synchronization
router.post('/queue', async (req, res) => {
    try {
        const { filePath, userId, changes, platform, isOffline = false } = req.body;

        if (!filePath || !userId || !platform) {
            return res.status(400).json({ error: 'File path, user ID, and platform are required.' });
        }

        const task = await queueFileForSync(filePath, userId, changes, platform, isOffline);
        res.status(200).json({ message: 'File queued for synchronization.', task });
    } catch (error) {
        console.error('Error queuing file for sync:', error);
        res.status(500).json({ error: 'An error occurred while queuing the file for sync.' });
    }
});

// Process the synchronization queue (manual trigger)
router.post('/process', async (req, res) => {
    try {
        await processSyncQueue();
        res.status(200).json({ message: 'Synchronization queue processed successfully.' });
    } catch (error) {
        console.error('Error processing synchronization queue:', error);
        res.status(500).json({ error: 'An error occurred while processing the synchronization queue.' });
    }
});

// Synchronize offline changes for a user
router.post('/sync-offline', async (req, res) => {
    try {
        const { userId, platform } = req.body;

        if (!userId || !platform) {
            return res.status(400).json({ error: 'User ID and platform are required.' });
        }

        await syncOfflineChanges(userId, platform);
        res.status(200).json({ message: 'Offline changes synchronized successfully.' });
    } catch (error) {
        console.error('Error syncing offline changes:', error);
        res.status(500).json({ error: 'An error occurred while syncing offline changes.' });
    }
});

// Retrieve synchronization status
router.get('/status', async (req, res) => {
    try {
        // Simulated response for now (implement actual logic to track status)
        res.status(200).json({ status: 'Sync in progress...', details: [] });
    } catch (error) {
        console.error('Error retrieving sync status:', error);
        res.status(500).json({ error: 'An error occurred while retrieving sync status.' });
    }
});

module.exports = router;
