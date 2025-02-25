// ✅ FILE: backend/src/routes/debug.js

import express from "express";
import { analyzeCodeWithXAI } from "../ai/xaiDebugger.js";

const router = express.Router();

/**
 * Route: POST /api/debug
 * Sends user-provided code to x.ai for debugging and returns suggestions.
 */
router.post("/", async (req, res) => {
    const { code, language } = req.body;

    if (!code) {
        return res.status(400).json({ error: "Code snippet is required for analysis." });
    }

    try {
        const analysis = await analyzeCodeWithXAI(code, language || "javascript");
        res.json({ analysis });
    } catch (error) {
        console.error("❌ Debugging request failed:", error);
        res.status(500).json({ error: "Internal server error. Please try again later." });
    }
});

export default router;
