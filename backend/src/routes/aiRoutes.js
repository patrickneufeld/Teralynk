import express from "express";
import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";
import AIIntegration, { queryAIPlatforms } from "../ai/aiIntegration.js";
import { logAILearning, runAISelfImprovement } from "../ai/aiLearningManager.js";
import db from "../config/db.js";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ✅ Ensure Secrets are Loaded from AWS Secrets Manager
const { OPENAI_API_KEY, SUNO_API_KEY, X_AI_API_KEY } = process.env;

if (!OPENAI_API_KEY || !SUNO_API_KEY || !X_AI_API_KEY) {
  console.error("❌ ERROR: Missing API keys from AWS Secrets Manager.");
  process.exit(1);
}

/**
 * ✅ Route: POST /api/ai/query
 * Description: Handles AI queries and retrieves responses from multiple AI platforms.
 */
router.post("/query", async (req, res) => {
  const { userId, query } = req.body;

  if (!userId || !query) {
    return res.status(400).json({ error: "User ID and query are required." });
  }

  try {
    const aiQueries = [
      { platform: "openai", payload: { query }, apiKey: OPENAI_API_KEY },
      { platform: "suno", payload: { query }, apiKey: SUNO_API_KEY },
    ];

    const responses = await queryAIPlatforms(userId, aiQueries);

    const formattedResponses = responses.map((response, index) => ({
      id: `${userId}-${index}`,
      platform: aiQueries[index].platform,
      result: response.result || "No result provided.",
    }));

    res.status(200).json({ responses: formattedResponses });
  } catch (error) {
    console.error("❌ Error querying AI platforms:", error);
    res.status(500).json({ error: "Failed to query AI platforms." });
  }
});

/**
 * ✅ Route: POST /api/ai/feedback
 * Description: Accepts and stores user feedback for AI responses.
 */
router.post("/feedback", async (req, res) => {
  const { responseId, feedback } = req.body;

  if (!responseId || !feedback) {
    return res.status(400).json({ error: "Response ID and feedback are required." });
  }

  try {
    await db.query("INSERT INTO ai_feedback (response_id, feedback, timestamp) VALUES ($1, $2, NOW())", [
      responseId,
      feedback,
    ]);

    res.status(200).json({ message: "Feedback submitted successfully." });
  } catch (error) {
    console.error("❌ Error submitting feedback:", error);
    res.status(500).json({ error: "Failed to submit feedback." });
  }
});

/**
 * ✅ Route: POST /api/ai/self-update
 * Description: Triggers AI self-updating mechanisms.
 */
router.post("/self-update", async (req, res) => {
  try {
    await runAISelfImprovement();
    res.status(200).json({ message: "AI Self-Improvement triggered." });
  } catch (error) {
    console.error("❌ Error during AI self-update:", error);
    res.status(500).json({ error: "An error occurred during AI self-update." });
  }
});

/**
 * ✅ Route: POST /api/ai/train
 * Description: Triggers AI model training based on user interactions.
 */
router.post("/train", async (req, res) => {
  try {
    console.log("🚀 Training AI model based on recent interactions...");

    const interactions = await db.query("SELECT * FROM ai_logs ORDER BY timestamp DESC LIMIT 50");

    if (!interactions.rows.length) {
      return res.status(400).json({ message: "No training data available." });
    }

    const trainingData = interactions.rows.map((row) => ({
      user: row.user_id,
      action: row.action,
      details: JSON.parse(row.details),
    }));

    const trainingResponse = await axios.post(
      "https://api.openai.com/v1/finetuning",
      {
        model: "gpt-4",
        data: trainingData,
      },
      {
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      }
    );

    res.status(200).json({ message: "AI training started.", data: trainingResponse.data });
  } catch (error) {
    console.error("❌ AI Training Failed:", error.message);
    res.status(500).json({ error: "Failed to train AI." });
  }
});

/**
 * ✅ Route: POST /api/ai/analyze-code
 * Description: Uses an AI system to analyze code for optimizations.
 */
router.post("/analyze-code", async (req, res) => {
  const { filePath } = req.body;

  if (!filePath) {
    return res.status(400).json({ error: "File path is required." });
  }

  try {
    const fullPath = path.resolve(__dirname, "../../frontend", filePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const code = fs.readFileSync(fullPath, "utf-8");

    const response = await axios.post(
      "https://api.x.ai/analyze", // Replace with actual x.ai API endpoint
      { code },
      {
        headers: {
          Authorization: `Bearer ${X_AI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.json(response.data);
  } catch (error) {
    console.error("❌ x.ai Code Analysis Error:", error.message);
    return res.status(500).json({ error: "Code analysis failed" });
  }
});

/**
 * ✅ Route: GET /api/ai/status
 * Description: Fetches the status of AI integrations and learning progress.
 */
router.get("/status", async (req, res) => {
  try {
    const lastTraining = await db.query("SELECT * FROM ai_logs ORDER BY timestamp DESC LIMIT 1");

    res.status(200).json({
      status: "AI systems are operational.",
      lastTraining: lastTraining.rows[0] || "No training logs available.",
    });
  } catch (error) {
    console.error("❌ Error fetching AI status:", error.message);
    res.status(500).json({ error: "Failed to retrieve AI status." });
  }
});

/**
 * ✅ Route: POST /api/ai/clear-logs
 * Description: Clears AI logs for debugging and testing purposes.
 */
router.post("/clear-logs", async (req, res) => {
  try {
    await db.query("DELETE FROM ai_logs");
    res.status(200).json({ message: "AI logs cleared." });
  } catch (error) {
    console.error("❌ Error clearing logs:", error.message);
    res.status(500).json({ error: "Failed to clear AI logs." });
  }
});

export default router;
