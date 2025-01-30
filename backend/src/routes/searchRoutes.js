// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/searchRoutes.js

const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const { getStorageClient } = require("../config/storageConfig");
const aiFileManager = require("../ai/aiFileManager");
const aiLearningManager = require("../ai/aiLearningManager");

const router = express.Router();

/**
 * Route: GET /api/search
 * Description: AI-powered search for files across storage providers.
 */
router.get("/", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { query, provider } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Search query is required." });
  }

  try {
    console.log(`🔍 AI Searching for: ${query} (Provider: ${provider || "All"})`);

    // Query AI for intelligent file retrieval suggestions
    const searchResults = await aiFileManager.searchFiles(userId, query, provider);
    
    // Log AI search decision
    await aiLearningManager.logAILearning(userId, "file_search", { query, provider, results: searchResults });

    res.status(200).json({ message: "Search completed", searchResults });
  } catch (error) {
    console.error("Error performing AI search:", error.message);
    res.status(500).json({ error: "Failed to perform AI search." });
  }
});

/**
 * Route: POST /api/search/recommendations
 * Description: AI recommends files based on past searches & usage patterns.
 */
router.post("/recommendations", authenticate, async (req, res) => {
  const { userId } = req.user;

  try {
    console.log(`🤖 AI Generating Recommendations for User: ${userId}`);

    // AI analyzes past interactions to suggest relevant files
    const recommendations = await aiFileManager.getRecommendedFiles(userId);
    
    // Log AI learning from recommendations
    await aiLearningManager.logAILearning(userId, "file_recommendations", { recommendations });

    res.status(200).json({ message: "Recommendations generated", recommendations });
  } catch (error) {
    console.error("Error generating AI recommendations:", error.message);
    res.status(500).json({ error: "Failed to generate recommendations." });
  }
});

module.exports = router;
