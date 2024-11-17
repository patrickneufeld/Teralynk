// File: /Users/patrick/Projects/Teralynk/backend/services/aiInsightsService.js

const natural = require('natural'); // For NLP processing
const fs = require('fs');
const path = require('path');
const { recordActivity } = require('./activityLogService');

// Directory for AI training data
const AI_DATA_PATH = path.join(__dirname, '../../ai_data');

// Ensure the AI data directory exists
if (!fs.existsSync(AI_DATA_PATH)) {
    fs.mkdirSync(AI_DATA_PATH, { recursive: true });
}

// Analyze file content using AI
const analyzeFileContent = async (filePath) => {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');

    // Example: Tokenize and analyze the content
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(content);

    // Generate basic insights (e.g., word count, most frequent terms)
    const wordFrequency = tokens.reduce((acc, word) => {
        word = word.toLowerCase();
        acc[word] = (acc[word] || 0) + 1;
        return acc;
    }, {});

    const insights = {
        wordCount: tokens.length,
        mostFrequentWords: Object.entries(wordFrequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10),
    };

    console.log(`AI insights generated for file: ${filePath}`);
    return insights;
};

// Train the AI system with user queries
const trainAIWithQuery = async (userId, query, response) => {
    if (!query || !response) {
        throw new Error('Both query and response are required for training.');
    }

    const trainingData = {
        userId,
        query,
        response,
        timestamp: new Date(),
    };

    const trainingFile = path.join(AI_DATA_PATH, 'training_data.json');

    const existingData = fs.existsSync(trainingFile)
        ? JSON.parse(fs.readFileSync(trainingFile, 'utf8'))
        : [];

    existingData.push(trainingData);

    fs.writeFileSync(trainingFile, JSON.stringify(existingData, null, 2));

    // Log activity
    await recordActivity(userId, 'trainAIWithQuery', null, { query, response });

    console.log(`AI trained with query: ${query}`);
    return trainingData;
};

// Retrieve AI insights for a user-specific query
const getAIInsightsForQuery = async (query, userId) => {
    if (!query) {
        throw new Error('Query is required to retrieve AI insights.');
    }

    // Simulate insight generation for the query
    const insights = {
        query,
        suggestions: [`Optimize "${query}" for better performance`, `Check related files for "${query}"`],
        timestamp: new Date(),
    };

    // Log activity
    await recordActivity(userId, 'getAIInsightsForQuery', null, { query, insights });

    console.log(`AI insights retrieved for query: ${query}`);
    return insights;
};

module.exports = {
    analyzeFileContent,
    trainAIWithQuery,
    getAIInsightsForQuery,
};
