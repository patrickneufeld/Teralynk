// File Path: backend/src/api/aiPerformanceAPI.mjs

import express from "express";
import fs from "fs";
import path from "path";
const router = express.Router();

router.get("/performance", (req, res) => {
    const logFilePath = path.join(__dirname, "../ai/ai_performance_log.json");

    if (fs.existsSync(logFilePath)) {
        const logs = JSON.parse(fs.readFileSync(logFilePath));
        res.json(logs);
    } else {
        res.json([]);
    }
});

module.exports = router;
