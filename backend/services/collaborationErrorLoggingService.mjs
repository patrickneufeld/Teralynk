// File Path: backend/services/collaborationErrorLoggingService.js

const fs = require('fs');
const path = require('path');

// Log file path (ensure the directory exists)
const logFilePath = path.join(__dirname, '../../logs/collaborationErrors.log');

/**
 * Logs an error related to a collaboration session.
 * @param {string} sessionId - The ID of the session where the error occurred.
 * @param {string} userId - The ID of the user involved in the error.
 * @param {string} errorMessage - The error message to log.
 */
const logError = (sessionId, userId, errorMessage) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} | Session: ${sessionId} | User: ${userId} | Error: ${errorMessage}\n`;

    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
            console.error('Error logging collaboration error:', err);
        } else {
            console.log('Collaboration error logged successfully.');
        }
    });
};

/**
 * Retrieves the most recent collaboration error logs.
 * @param {number} limit - The number of error logs to retrieve.
 * @returns {Promise<string>} - A promise that resolves to the most recent error logs.
 */
const getRecentErrors = (limit = 10) => {
    return new Promise((resolve, reject) => {
        fs.readFile(logFilePath, 'utf8', (err, data) => {
            if (err) {
                reject('Error reading collaboration logs.');
            }

            const logs = data.split('\n').filter(Boolean);
            const recentLogs = logs.slice(-limit);
            resolve(recentLogs.join('\n'));
        });
    });
};

/**
 * Clears the collaboration error logs.
 */
const clearLogs = () => {
    fs.truncate(logFilePath, 0, (err) => {
        if (err) {
            console.error('Error clearing collaboration logs:', err);
        } else {
            console.log('Collaboration error logs cleared.');
        }
    });
};

module.exports = {
    logError,
    getRecentErrors,
    clearLogs,
};
