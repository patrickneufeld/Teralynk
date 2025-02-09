const Log = require("../models/LogModel");
const logger = require("../config/logger");
const { Parser } = require("json2csv");

/**
 * Download AI Logs as CSV
 */
const downloadLogs = async (req, res) => {
    try {
        const logs = await Log.find({});
        if (!logs || logs.length === 0) {
            return res.status(404).json({ success: false, message: "No logs found" });
        }

        const fields = ["_id", "message", "level", "timestamp"];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(logs);

        res.header("Content-Type", "text/csv");
        res.attachment("ai_logs.csv");
        res.send(csv);
    } catch (error) {
        logger.error("Error downloading logs:", error);
        res.status(500).json({ success: false, message: "Failed to download logs" });
    }
};

// ✅ Ensure function is exported
module.exports = { downloadLogs };
