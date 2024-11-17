// File: /backend/api/metadata.js

const express = require('express');
const router = express.Router();
const {
    extractMetadata,
    saveOrUpdateMetadata,
    getMetadata,
    getMetadataHistory,
    deleteMetadata,
    searchMetadata,
} = require('../services/metadataService');

// Extract and save metadata for a file
router.post('/save', async (req, res) => {
    try {
        const { filePath, customMetadata = {} } = req.body;

        if (!filePath) {
            return res.status(400).json({ error: 'File path is required.' });
        }

        const metadata = await saveOrUpdateMetadata(filePath, customMetadata);
        res.status(201).json({ message: 'Metadata saved successfully.', metadata });
    } catch (error) {
        console.error('Error saving metadata:', error);
        res.status(500).json({ error: 'An error occurred while saving metadata.', details: error.message });
    }
});

// Get metadata for a file (latest version)
router.get('/get', async (req, res) => {
    try {
        const { filePath } = req.query;

        if (!filePath) {
            return res.status(400).json({ error: 'File path is required.' });
        }

        const metadata = await getMetadata(filePath);
        res.status(200).json({ metadata });
    } catch (error) {
        console.error('Error fetching metadata:', error);
        res.status(500).json({ error: 'An error occurred while fetching metadata.', details: error.message });
    }
});

// Get metadata history for a file
router.get('/history', async (req, res) => {
    try {
        const { filePath } = req.query;

        if (!filePath) {
            return res.status(400).json({ error: 'File path is required.' });
        }

        const history = await getMetadataHistory(filePath);
        res.status(200).json({ history });
    } catch (error) {
        console.error('Error fetching metadata history:', error);
        res.status(500).json({ error: 'An error occurred while fetching metadata history.', details: error.message });
    }
});

// Delete metadata for a file
router.delete('/delete', async (req, res) => {
    try {
        const { filePath } = req.body;

        if (!filePath) {
            return res.status(400).json({ error: 'File path is required.' });
        }

        const response = await deleteMetadata(filePath);
        res.status(200).json(response);
    } catch (error) {
        console.error('Error deleting metadata:', error);
        res.status(500).json({ error: 'An error occurred while deleting metadata.', details: error.message });
    }
});

// Search metadata
router.post('/search', async (req, res) => {
    try {
        const { filters = {} } = req.body;

        if (Object.keys(filters).length === 0) {
            return res.status(400).json({ error: 'At least one filter is required for searching metadata.' });
        }

        const results = await searchMetadata(filters);
        res.status(200).json({ results });
    } catch (error) {
        console.error('Error searching metadata:', error);
        res.status(500).json({ error: 'An error occurred while searching metadata.', details: error.message });
    }
});

module.exports = router;
