// File Path: backend/src/ai/aiUsageLogger.js

/**
 * AI Usage Logger
 * Logs all AI queries and tracks usage patterns for analysis.
 */

const fs = require('fs');
const logFile = "ai_usage.log";

function logUsage(userId, query, response) {
    const logEntry = `${new Date().toISOString()} | User: ${userId} | Query: ${query} | Response: ${response}\n`;
    fs.appendFileSync(logFile, logEntry);
}

module.exports = { logUsage };
