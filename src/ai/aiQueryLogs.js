/* File Path: backend/src/ai/aiQueryLogs.js */

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'ai_query_logs.json');

// Function to log AI queries
function logQuery(query, response, user) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        user,
        query,
        response
    };
    
    let logs = [];
    if (fs.existsSync(LOG_FILE)) {
        logs = JSON.parse(fs.readFileSync(LOG_FILE));
    }
    logs.push(logEntry);
    
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

module.exports = { logQuery };