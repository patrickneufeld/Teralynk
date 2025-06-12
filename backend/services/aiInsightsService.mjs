// File: /backend/services/aiInsightsService.js

const natural = require('natural'); // For NLP processing
const fs = require('fs').promises; // Use async fs methods
const path = require('path');
const { recordActivity } = require('./activityLogService');

// Use environment variable for AI data directory
const AI_DATA_PATH = process.env.AI_DATA_PATH || path.join(__dirname, '../../ai_data');

// Ensure the AI data directory exists
const ensureDirectoryExists = async (dirPath) => {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        console.error(`Error creating directory: ${dirPath}`, error);
    }
};
ensureDirectoryExists(AI_DATA_PATH);

// **Analyze file content using AI**
const analyzeFileContent = async (filePath) => {
    if (!filePath) throw new Error('File path is required.');

    try {
        const fileExists = await fs.stat(filePath).catch(() => false);
        if (!fileExists) throw new Error(`File does not exist: ${filePath}`);

        const content = await fs.readFile(filePath, 'utf8');

        // Example: Tokenize and analyze the content
        const tokenizer = new natural.WordTokenizer();
        const tokens = tokenizer.tokenize(content);

        // Generate insights (word count, most frequent terms, sentiment)
        const wordFrequency = tokens.reduce((acc, word) => {
            word = word.toLowerCase();
            acc[word] = (acc[word] || 0) + 1;
            return acc;
        }, {});

        const sentimentAnalyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
        const sentimentScore = sentimentAnalyzer.getSentiment(tokens);

        const insights = {
            wordCount: tokens.length,
            mostFrequentWords: Object.entries(wordFrequency)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10),
            sentimentScore,
        };

        console.log(`AI insights generated for file: ${filePath}`);
        return insights;
    } catch (error) {
        console.error('Error analyzing file content:', error.message);
        throw new Error('An error occurred while analyzing the file content.');
    }
};

// **Train the AI system with user queries**
const trainAIWithQuery = async (userId, query, response) => {
    if (!query || !response) throw new Error('Both query and response are required for training.');

    try {
        const trainingData = {
            userId,
            query,
            response,
            timestamp: new Date(),
        };

        const trainingFile = path.join(AI_DATA_PATH, 'training_data.json');

        let existingData = [];
        try {
            const fileData = await fs.readFile(trainingFile, 'utf8');
            existingData = JSON.parse(fileData);
        } catch (error) {
            console.warn('No existing training data found. Creating a new file.');
        }

        existingData.push(trainingData);
        await fs.writeFile(trainingFile, JSON.stringify(existingData, null, 2));

        await recordActivity(userId, 'trainAIWithQuery', null, { query, response });
        console.log(`AI trained with query: ${query}`);
        return trainingData;
    } catch (error) {
        console.error('Error training AI with query:', error.message);
        throw new Error('An error occurred while training AI.');
    }
};

// **Retrieve AI insights for a user-specific query**
const getAIInsightsForQuery = async (query, userId) => {
    if (!query) throw new Error('Query is required to retrieve AI insights.');

    try {
        const insights = {
            query,
            suggestions: [`Optimize "${query}" for better performance`, `Check related files for "${query}"`],
            timestamp: new Date(),
        };

        await recordActivity(userId, 'getAIInsightsForQuery', null, { query, insights });
        console.log(`AI insights retrieved for query: ${query}`);
        return insights;
    } catch (error) {
        console.error('Error retrieving AI insights:', error.message);
        throw new Error('An error occurred while retrieving AI insights.');
    }
};

module.exports = {
    analyzeFileContent,
    trainAIWithQuery,
    getAIInsightsForQuery,
};
