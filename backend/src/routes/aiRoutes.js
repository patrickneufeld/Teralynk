// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/routes/aiRoutes.js

const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const AIIntegration = require("../ai/aiIntegration");
const AILearningManager = require("../ai/aiLearningManager");
const AICodeUpdater = require("../ai/aiCodeUpdater");
const db = require("../db");

const router = express.Router();

/**
 * ✅ Route: POST /api/ai/query
 * Description: Handle AI queries and return responses from connected platforms.
 */
router.post("/query", async (req, res) => {
  const { userId, query } = req.body;

  if (!userId || !query) {
    return res.status(400).json({ error: "User ID and query are required." });
  }

  try {
    // Define queries for multiple AI platforms
    const aiQueries = [
      {
        platform: "openai",
        payload: { query },
        apiKey: process.env.OPENAI_API_KEY,
      },
      {
        platform: "suno",
        payload: { query },
        apiKey: process.env.SUNO_API_KEY,
      },
    ];

    // Query AI platforms using AIIntegration module
    const responses = await AIIntegration.queryAIPlatforms(userId, aiQueries);

    // Format responses
    const formattedResponses = responses.map((response, index) => ({
      id: `${userId}-${index}`, // Unique response ID
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
 * Description: Accept and store user feedback for AI responses.
 */
router.post("/feedback", async (req, res) => {
  const { responseId, feedback } = req.body;

  if (!responseId || !feedback) {
    return res.status(400).json({ error: "Response ID and feedback are required." });
  }

  try {
    // Store feedback in the database
    await db.logInteraction({
      userId: responseId.split("-")[0], // Extract userId from responseId
      platform: null,
      request: null,
      response: { feedback },
      timestamp: new Date(),
    });

    res.status(200).json({ message: "Feedback submitted successfully." });
  } catch (error) {
    console.error("❌ Error submitting feedback:", error);
    res.status(500).json({ error: "Failed to submit feedback." });
  }
});

/**
 * ✅ Route: POST /api/ai/self-update
 * Description: Trigger AI self-updating mechanism.
 */
router.post("/self-update", async (req, res) => {
  const { filePath, context } = req.body;

  if (!filePath || !context) {
    return res.status(400).json({ error: "File path and context are required." });
  }

  try {
    // Query ChatGPT for code improvements
    const suggestions = await AICodeUpdater.queryChatGPTForCode(context);
    console.log("✅ Received suggestions:", suggestions);

    // Apply suggested improvements
    const success = await AICodeUpdater.applyCodeUpdate(filePath, suggestions);

    if (success) {
      res.status(200).json({ message: "Self-update applied successfully.", suggestions });
    } else {
      res.status(500).json({ error: "Failed to apply the self-update." });
    }
  } catch (error) {
    console.error("❌ Error during self-update:", error);
    res.status(500).json({ error: "An error occurred during self-update." });
  }
});

/**
 * ✅ Route: POST /api/ai/analyze-code
 * Description: Analyze code using x.ai and return issues found.
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
          Authorization: `Bearer ${process.env.X_AI_API_KEY}`,
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

module.exports = router;
