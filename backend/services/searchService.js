const fs = require('fs').promises; // Use async fs methods
const path = require('path');
const natural = require('natural'); // NLP library for tokenization and relevance scoring
const { hasPermission } = require('./rbacService'); // RBAC integration
const { analyzeSearchQuery } = require('./aiInsightsService'); // AI integration
const { query } = require('./db'); // Database integration

// Sample directory for scanning files (adjust to your actual storage path)
const storageDirectory = path.join(__dirname, '../../storage');

// Function to search for files based on a query and filters
const searchFiles = async (query, userId, filters = {}) => {
    try {
        // AI integration for query analysis
        const aiInsights = await analyzeSearchQuery(query);

        const tokenizer = new natural.WordTokenizer();
        const queryTokens = tokenizer.tokenize(query.toLowerCase());

        const results = [];

        // Recursively scan the storage directory asynchronously
        await scanDirectory(storageDirectory, queryTokens, userId, filters, aiInsights, results);

        // Return results sorted by relevance and additional AI insights
        return results.sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
        console.error('Error in searchFiles:', error);
        throw new Error('An error occurred while searching for files.');
    }
};

// Asynchronous directory scanning
const scanDirectory = async (directory, queryTokens, userId, filters, aiInsights, results) => {
    const files = await fs.readdir(directory);

    for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
            await scanDirectory(filePath, queryTokens, userId, filters, aiInsights, results); // Recursively scan subdirectories
        } else if (stats.isFile()) {
            const fileName = file.toLowerCase();

            // Check relevance based on query tokens
            const relevance = queryTokens.reduce(
                (score, token) => (fileName.includes(token) ? score + 1 : score),
                0
            );

            // Extract file metadata
            const metadata = {
                fileName: file,
                path: filePath,
                relevance,
                fileType: path.extname(file).slice(1), // File extension as type
                dateCreated: stats.birthtime, // File creation date
                size: stats.size, // File size in bytes
            };

            // Enforce RBAC: Ensure user has access to the file
            if (!await hasPermission(userId, 'read')) {
                continue;
            }

            // Apply filters
            if (applyFilters(metadata, filters)) {
                results.push({ ...metadata, aiInsights });
            }
        }
    }
};

// Function to apply filters to file metadata
const applyFilters = (metadata, filters) => {
    if (filters.fileType && metadata.fileType !== filters.fileType) {
        return false;
    }
    if (filters.dateCreatedFrom && new Date(metadata.dateCreated) < new Date(filters.dateCreatedFrom)) {
        return false;
    }
    if (filters.dateCreatedTo && new Date(metadata.dateCreated) > new Date(filters.dateCreatedTo)) {
        return false;
    }
    if (filters.minSize && metadata.size < filters.minSize) {
        return false;
    }
    if (filters.maxSize && metadata.size > filters.maxSize) {
        return false;
    }
    return true;
};

// Save search results to the database or cache for quick retrieval (optional)
const saveSearchResults = async (userId, query, results) => {
    try {
        // Optionally store the search results in the database
        const resultJSON = JSON.stringify(results);
        await query(
            'INSERT INTO search_history (user_id, query, results, timestamp) VALUES ($1, $2, $3, $4)',
            [userId, query, resultJSON, new Date()]
        );
    } catch (error) {
        console.error('Error saving search results to database:', error);
    }
};

module.exports = { searchFiles, saveSearchResults };
