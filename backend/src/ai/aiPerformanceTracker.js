// File Path: backend/src/ai/aiPerformanceTracker.js

const fs = require("fs");
const path = require("path");

const logFilePath = path.join(__dirname, "ai_performance_log.json");

function logPerformance(mse, mae, rse, timestamp = new Date().toISOString()) {
    const logEntry = { timestamp, mse, mae, rse };
    let logs = [];

    if (fs.existsSync(logFilePath)) {
        logs = JSON.parse(fs.readFileSync(logFilePath));
    }

    logs.push(logEntry);
    fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
}

module.exports = { logPerformance };
