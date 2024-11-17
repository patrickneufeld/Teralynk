// File: /Users/patrick/Projects/Teralynk/backend/api/versioning.js

const express = require('express');
const router = express.Router();
const {
    saveFileVersion,
    getFileVersionHistory,
    getLatestFileVersion,
    rollbackFileVersion,
    detectAndResolveConflicts,
    validateFileExists,
} = require('../services/versioningService');

// Save a new version of a file
router.post('/save-version', async (req, res) => {
    try {
        const { filePath, userId, changes, metadata = {} } = req.body;

        if (!filePath || !userId || !changes || !Array.isArray(changes)) {
            return res.status(400).json({ error: 'Invalid version data provided.' });
        }

        // Validate the file exists before saving a version
        await validateFileExists(filePath);

        const newVersion = await saveFileVersion(filePath, userId, changes, metadata);
        res.status(201).json({ message: 'Version saved successfully.', version: newVersion });
    } catch (error) {
        console.error('Error saving file version:', error);
        res.status(500).json({ error: 'An error occurred while saving the file version.' });
    }
});

// Get version history for a file
router.get('/version-history', async (req, res) => {
    try {
        const { filePath, userId } = req.query;

        if (!filePath || !userId) {
            return res.status(400).json({ error: 'File path and user ID are required.' });
        }

        const history = await getFileVersionHistory(filePath, userId);
        res.status(200).json({ history });
    } catch (error) {
        console.error('Error fetching version history:', error);
        res.status(500).json({ error: 'An error occurred while fetching version history.' });
    }
});

// Retrieve the latest version of a file
router.get('/latest-version', async (req, res) => {
    try {
        const { filePath, userId } = req.query;

        if (!filePath || !userId) {
            return res.status(400).json({ error: 'File path and user ID are required.' });
        }

        const latestVersion = await getLatestFileVersion(filePath, userId);
        res.status(200).json({ latestVersion });
    } catch (error) {
        console.error('Error retrieving latest version:', error);
        res.status(500).json({ error: 'An error occurred while retrieving the latest version.' });
    }
});

// Rollback to a specific version
router.post('/rollback-version', async (req, res) => {
    try {
        const { filePath, userId, versionId } = req.body;

        if (!filePath || !userId || !versionId) {
            return res.status(400).json({ error: 'File path, user ID, and version ID are required.' });
        }

        const rolledBackVersion = await rollbackFileVersion(filePath, userId, versionId);
        res.status(200).json({ message: 'File rolled back successfully.', version: rolledBackVersion });
    } catch (error) {
        console.error('Error rolling back file version:', error);
        res.status(500).json({ error: 'An error occurred while rolling back the version.' });
    }
});

// Detect and resolve conflicts
router.post('/detect-conflicts', async (req, res) => {
    try {
        const { filePath, userId, userChanges } = req.body;

        if (!filePath || !userId || !userChanges || !Array.isArray(userChanges)) {
            return res.status(400).json({ error: 'Invalid conflict data provided.' });
        }

        const conflictData = await detectAndResolveConflicts(filePath, userId, userChanges);
        res.status(200).json({ conflict: conflictData });
    } catch (error) {
        console.error('Error detecting conflicts:', error);
        res.status(500).json({ error: 'An error occurred while detecting conflicts.' });
    }
});

module.exports = router;
