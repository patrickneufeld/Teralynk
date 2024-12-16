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
    getMetadataDetails,
    updateMetadata
} = require('../services/metadataService');
const rbacMiddleware = require('../middleware/rbacMiddleware');

// Middleware to validate request body
const validateRequestBody = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    next();
};

// **1️⃣ Extract and save metadata for a file**
router.post('/save', rbacMiddleware('user'), validateRequestBody(['filePath']), async (req, res) => {
    try {
        const { filePath, customMetadata = {} } = req.body;

        const metadata = await saveOrUpdateMetadata(filePath, customMetadata);
        res.status(201).json({ message: 'Metadata saved successfully.', metadata });
    } catch (error) {
        console.error('Error saving metadata:', error);
        res.status(500).json({ error: 'An error occurred while saving metadata.', details: error.message });
    }
});

// **2️⃣ Get metadata for a file (latest version)**
router.get('/get', rbacMiddleware('user'), async (req, res) => {
    try {
        const { filePath } = req.query;

        if (!filePath) {
            return res.status(400).json({ error: 'File path is required.' });
        }

        const metadata = await getMetadata(filePath);
        res.status(200).json({ message: 'Metadata retrieved successfully.', metadata });
    } catch (error) {
        console.error('Error fetching metadata:', error);
        res.status(500).json({ error: 'An error occurred while fetching metadata.', details: error.message });
    }
});

// **3️⃣ Get metadata history for a file**
router.get('/history', rbacMiddleware('user'), async (req, res) => {
    try {
        const { filePath } = req.query;

        if (!filePath) {
            return res.status(400).json({ error: 'File path is required.' });
        }

        const history = await getMetadataHistory(filePath);
        res.status(200).json({ message: 'Metadata history retrieved successfully.', history });
    } catch (error) {
        console.error('Error fetching metadata history:', error);
        res.status(500).json({ error: 'An error occurred while fetching metadata history.', details: error.message });
    }
});

// **4️⃣ Delete metadata for a file**
router.delete('/delete', rbacMiddleware('user'), validateRequestBody(['filePath']), async (req, res) => {
    try {
        const { filePath } = req.body;

        const response = await deleteMetadata(filePath);
        res.status(200).json({ message: 'Metadata deleted successfully.', response });
    } catch (error) {
        console.error('Error deleting metadata:', error);
        res.status(500).json({ error: 'An error occurred while deleting metadata.', details: error.message });
    }
});

// **5️⃣ Search metadata**
router.post('/search', rbacMiddleware('user'), validateRequestBody(['filters']), async (req, res) => {
    try {
        const { filters } = req.body;

        if (Object.keys(filters).length === 0) {
            return res.status(400).json({ error: 'At least one filter is required for searching metadata.' });
        }

        const results = await searchMetadata(filters);
        res.status(200).json({ message: 'Metadata search completed successfully.', results });
    } catch (error) {
        console.error('Error searching metadata:', error);
        res.status(500).json({ error: 'An error occurred while searching metadata.', details: error.message });
    }
});

// **6️⃣ Get detailed metadata for a specific file**
router.get('/details', rbacMiddleware('user'), async (req, res) => {
    try {
        const { filePath } = req.query;

        if (!filePath) {
            return res.status(400).json({ error: 'File path is required.' });
        }

        const metadataDetails = await getMetadataDetails(filePath);
        res.status(200).json({ message: 'Metadata details retrieved successfully.', metadataDetails });
    } catch (error) {
        console.error('Error retrieving metadata details:', error);
        res.status(500).json({ error: 'An error occurred while retrieving metadata details.', details: error.message });
    }
});

// **7️⃣ Update metadata for a file**
router.put('/update', rbacMiddleware('user'), validateRequestBody(['filePath', 'updatedMetadata']), async (req, res) => {
    try {
        const { filePath, updatedMetadata } = req.body;

        const metadata = await updateMetadata(filePath, updatedMetadata);
        res.status(200).json({ message: 'Metadata updated successfully.', metadata });
    } catch (error) {
        console.error('Error updating metadata:', error);
        res.status(500).json({ error: 'An error occurred while updating metadata.', details: error.message });
    }
});

module.exports = router;
