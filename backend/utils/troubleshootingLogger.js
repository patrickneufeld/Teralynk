// File Path: /Users/patrick/Projects/Teralynk/backend/utils/troubleshootingLogger.js

const fs = require("fs");
const path = require("path");
const winston = require("winston");
const axios = require("axios");

// ✅ Define Log Directory
const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// ✅ Configure Winston Logger
const troubleshootingLogger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: path.join(logDir, "troubleshooting.log"), level: "info" }),
        new winston.transports.File({ filename: path.join(logDir, "troubleshooting-errors.log"), level: "error" }),
    ],
});

// ✅ Function to Log General Troubleshooting Activities
const logTroubleshooting = (message, details = {}) => {
    const logData = {
        message,
        details,
        timestamp: new Date().toISOString(),
    };
    troubleshootingLogger.info(logData);
    console.log("✅ [Troubleshooting Log]:", logData);
};

// ✅ Function to Log Troubleshooting Errors
const logTroubleshootingError = (errorMessage, errorDetails = {}) => {
    const errorData = {
        message: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
    };
    troubleshootingLogger.error(errorData);
    console.error("❌ [Troubleshooting Error]:", errorData);
};

// ✅ Function to Retrieve Troubleshooting Logs
const getTroubleshootingLogs = async () => {
    try {
        const logs = fs.readFileSync(path.join(logDir, "troubleshooting.log"), "utf8");
        return logs.split("\n").filter((line) => line.trim() !== "");
    } catch (err) {
        logTroubleshootingError("Failed to retrieve troubleshooting logs", { error: err.message });
        throw new Error("Error retrieving troubleshooting logs");
    }
};

// ✅ Function to Retrieve Troubleshooting Error Logs
const getTroubleshootingErrorLogs = async () => {
    try {
        const logs = fs.readFileSync(path.join(logDir, "troubleshooting-errors.log"), "utf8");
        return logs.split("\n").filter((line) => line.trim() !== "");
    } catch (err) {
        logTroubleshootingError("Failed to retrieve troubleshooting error logs", { error: err.message });
        throw new Error("Error retrieving troubleshooting error logs");
    }
};

// ✅ AI-Powered Troubleshooting Insights
const getAIInsights = async (logData) => {
    if (!process.env.OPENAI_API_KEY) {
        logTroubleshootingError("Missing OpenAI API Key", {});
        return "AI Insights Unavailable: Missing API Key.";
    }

    try {
        const prompt = `Analyze the following troubleshooting logs and provide improvement suggestions:\n\n${logData}`;
        const response = await axios.post(
            "https://api.openai.com/v1/completions",
            {
                model: "gpt-4",
                prompt,
                max_tokens: 500,
                temperature: 0.5,
            },
            {
                headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
            }
        );

        return response.data.choices[0].text.trim();
    } catch (error) {
        logTroubleshootingError("AI analysis failed", { error: error.message });
        return "AI analysis failed: Unable to process logs.";
    }
};

// ✅ Function to Automatically Backup Logs
const backupLogs = () => {
    const backupPath = path.join(logDir, `backup-troubleshooting-${Date.now()}.log`);
    try {
        const logContent = fs.readFileSync(path.join(logDir, "troubleshooting.log"), "utf8");
        fs.writeFileSync(backupPath, logContent, "utf8");
        logTroubleshooting("Successfully backed up troubleshooting logs", { backupPath });
    } catch (error) {
        logTroubleshootingError("Failed to backup logs", { error: error.message });
    }
};

// ✅ Function to Clear Logs (Admin Only)
const clearLogs = () => {
    try {
        fs.writeFileSync(path.join(logDir, "troubleshooting.log"), "", "utf8");
        fs.writeFileSync(path.join(logDir, "troubleshooting-errors.log"), "", "utf8");
        logTroubleshooting("All troubleshooting logs cleared successfully");
    } catch (error) {
        logTroubleshootingError("Failed to clear troubleshooting logs", { error: error.message });
    }
};

// ✅ Export All Functions for Use in Other Modules
module.exports = {
    logTroubleshooting,
    logTroubleshootingError,
    getTroubleshootingLogs,
    getTroubleshootingErrorLogs,
    getAIInsights,
    backupLogs,
    clearLogs,
};
