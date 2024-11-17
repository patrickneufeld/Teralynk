// File: /Users/patrick/Projects/Teralynk/backend/api/fileSharing.js

const express = require('express');
const router = express.Router();
const {
    generateShareableLink,
    getSharedFile,
    deleteShareableLink,
    listShareableLinks,
} = require('../services/fileSharingService');

// Generate a shareable link for a file
router.post('/generate', async (req, res) => {
    try {
        const { filePath, userId, permissions = 'view', expiration = null } = req.body;

        if (!filePath || !userId) {
            return res.status(400).json({ error: 'File path and user ID are required.' });
        }

        const shareableLink = await generateShareableLink(filePath, userId, permissions, expiration);
        res.status(201).json({ message: 'Shareable link generated successfully.', shareableLink });
    } catch (error) {
        console.error('Error generating shareable link:', error);
        res.status(500).json({ error: 'An error occurred while generating the shareable link.' });
    }
});

// Retrieve shared file information using the share ID
router.get('/get/:shareId', async (req, res) => {
    try {
        const { shareId } = req.params;
        const { userId } = req.query;

        if (!shareId || !userId) {
            return res.status(400).json({ error: 'Share ID and user ID are required.' });
        }

        const sharedFile = await getSharedFile(shareId, userId);
        res.status(200).json({ sharedFile });
    } catch (error) {
        console.error('Error retrieving shared file:', error);
        res.status(500).json({ error: 'An error occurred while retrieving the shared file.' });
    }
});

// Delete a shareable link
router.delete('/delete/:shareId', async (req, res) => {
    try {
        const { shareId } = req.params;
        const { userId } = req.body;

        if (!shareId || !userId) {
            return res.status(400).json({ error: 'Share ID and user ID are required.' });
        }

        const response = await deleteShareableLink(shareId, userId);
        res.status(200).json(response);
    } catch (error) {
        console.error('Error deleting shareable link:', error);
        res.status(500).json({ error: 'An error occurred while deleting the shareable link.' });
    }
});

// List all active shareable links for a file
router.get('/list', async (req, res) => {
    try {
        const { filePath, userId } = req.query;

        if (!filePath || !userId) {
            return res.status(400).json({ error: 'File path and user ID are required.' });
        }

        const activeLinks = await listShareableLinks(filePath, userId);
        res.status(200).json({ activeLinks });
    } catch (error) {
        console.error('Error listing shareable links:', error);
        res.status(500).json({ error: 'An error occurred while listing shareable links.' });
    }
});

module.exports = router;
