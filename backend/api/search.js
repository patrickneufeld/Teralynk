// File: /backend/api/search.js

const express = require('express');
const router = express.Router();
const { searchFiles } = require('../services/searchService');
const { hasPermission } = require('../services/rbacService'); // RBAC integration

// Route to handle search requests
router.post('/search', async (req, res) => {
    try {
        const {
            query,
            userId, // Assume userId is passed in the request
            limit = 10,
            page = 1,
            filters = {}, // Filters for metadata (e.g., fileType, dateCreated)
            sortBy = "relevance", // Sorting options: relevance, dateCreated, fileName
            sortOrder = "desc", // Sorting order: asc or desc
        } = req.body;

        // Validate query parameter
        if (!query || query.trim() === "") {
            return res.status(400).json({ error: "Search query is required." });
        }

        // Validate user permissions
        if (!hasPermission(userId, 'read')) {
            return res.status(403).json({ error: "You do not have permission to search files." });
        }

        // Perform the search
        const results = await searchFiles(query, userId, filters);

        // Sort results
        results.sort((a, b) => {
            if (sortBy === "relevance") {
                return sortOrder === "asc" ? a.relevance - b.relevance : b.relevance - a.relevance;
            } else if (sortBy === "dateCreated") {
                return sortOrder === "asc"
                    ? new Date(a.dateCreated) - new Date(b.dateCreated)
                    : new Date(b.dateCreated) - new Date(a.dateCreated);
            } else if (sortBy === "fileName") {
                return sortOrder === "asc"
                    ? a.fileName.localeCompare(b.fileName)
                    : b.fileName.localeCompare(a.fileName);
            }
            return 0;
        });

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const paginatedResults = results.slice(startIndex, startIndex + limit);

        // Return response
        res.status(200).json({
            results: paginatedResults,
            totalResults: results.length,
            page,
            totalPages: Math.ceil(results.length / limit),
        });
    } catch (error) {
        console.error("Error in search API:", error);
        res.status(500).json({ error: "An error occurred while performing the search.", details: error.message });
    }
});

module.exports = router;
