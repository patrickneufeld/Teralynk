// File: /backend/services/searchService.js

const fs = require('fs').promises; // Use async fs methods
const path = require('path');
const natural = require('natural'); // NLP library for tokenization and relevance scoring
const { hasPermission } = require('./rbacService'); // RBAC integration
const { analyzeSearchQuery } = require('./aiInsightsService'); // AI integration
const { query } = require('./db'); // Database integration

// Define the storage directory (adjust to your actual storage path)
const STORAGE_DIRECTORY = path.join(__dirname, '../../storage');

// **Search for files based on a query and filters**
const searchFiles = async (searchQuery, userId, filters = {}) => {
    if (!searchQuery || !userId) {
        throw new Error('Search query and user ID are required.');
    }

    try {
        // Analyze the search query using AI
        const aiInsights = await analyzeSearchQuery(searchQuery);

        // Tokenize the search query
        const tokenizer = new natural.WordTokenizer();
        const queryTokens = tokenizer.tokenize(searchQuery.toLowerCase());

        const results = [];

        // Recursively scan the storage directory
        await scanDirectory(STORAGE_DIRECTORY, queryTokens, userId, filters, aiInsights, results);

        // Sort results by relevance and return along with AI insights
        return {
            results: results.sort((a, b) => b.relevance - a.relevance),
            aiInsights,
        };
    } catch (error) {
        console.error('Error in searchFiles:', error.message);
        throw new Error('An error occurred while searching for files.');
    }
};

// **Scan a directory asynchronously**
const scanDirectory = async (directory, queryTokens, userId, filters, aiInsights, results) => {
    try {
        const files = await fs.readdir(directory);

        for (const file of files) {
            const filePath = path.join(directory, file);
            const stats = await fs.stat(filePath);

            if (stats.isDirectory()) {
                // Recursively scan subdirectories
                await scanDirectory(filePath, queryTokens, userId, filters, aiInsights, results);
            } else if (stats.isFile()) {
                // Calculate relevance based on query tokens
                const relevance = calculateRelevance(file.toLowerCase(), queryTokens);

                // Extract metadata for the file
                const metadata = extractMetadata(filePath, stats, relevance);

                // Check user permissions
                if (!(await hasPermission(userId, 'read'))) {
                    continue; // Skip files the user cannot access
                }

                // Apply filters
                if (applyFilters(metadata, filters)) {
                    results.push({ ...metadata, aiInsights });
                }
            }
        }
    } catch (error) {
        console.error(`Error scanning directory ${directory}:`, error.message);
        throw new Error('An error occurred during directory scanning.');
    }
};

// **Calculate relevance based on query tokens**
const calculateRelevance = (fileName, queryTokens) => {
    return queryTokens.reduce(
        (score, token) => (fileName.includes(token) ? score + 1 : score),
        0
    );
};

// **Extract metadata from file stats**
const extractMetadata = (filePath, stats, relevance) => {
    return {
        fileName: path.basename(filePath),
        path: filePath,
        relevance,
        fileType: path.extname(filePath).slice(1),
        dateCreated: stats.birthtime,
        size: stats.size,
    };
};

// **Apply filters to metadata**
const applyFilters = (metadata, filters) => {
    if (filters.fileType && metadata.fileType !== filters.fileType) return false;
    if (filters.dateCreatedFrom && new Date(metadata.dateCreated) < new Date(filters.dateCreatedFrom)) return false;
    if (filters.dateCreatedTo && new Date(metadata.dateCreated) > new Date(filters.dateCreatedTo)) return false;
    if (filters.minSize && metadata.size < filters.minSize) return false;
    if (filters.maxSize && metadata.size > filters.maxSize) return false;
    return true;
};

// **Save search results to the database**
const saveSearchResults = async (userId, searchQuery, results) => {
    try {
        await query(
            'INSERT INTO search_history (user_id, query, results, timestamp) VALUES ($1, $2, $3, $4)',
            [userId, searchQuery, JSON.stringify(results), new Date()]
        );
    } catch (error) {
        console.error('Error saving search results to database:', error.message);
        throw new Error('Failed to save search results.');
    }
};

// **Retrieve search history for a user**
const getSearchHistory = async (userId) => {
    try {
        const result = await query(
            'SELECT * FROM search_history WHERE user_id = $1 ORDER BY timestamp DESC',
            [userId]
        );
        return result.rows.map((row) => ({
            query: row.query,
            results: JSON.parse(row.results),
            timestamp: row.timestamp,
        }));
    } catch (error) {
        console.error('Error retrieving search history:', error.message);
        throw new Error('Failed to retrieve search history.');
    }
};

module.exports = {
    searchFiles,
    saveSearchResults,
    getSearchHistory,
};
