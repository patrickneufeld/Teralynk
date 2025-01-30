// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/fileSearchRoutes.js

const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const aiFileSearch = require("../ai/aiFileSearch");
const aiLearningManager = require("../ai/aiLearningManager");

const router = express.Router();

/**
 * Route: GET /api/files/search
 * Description: AI performs a semantic file search.
 */
router.get("/search", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Search query is required." });
  }

  try {
    console.log(`🔍 AI Searching Files for Query: ${query}`);

    // AI performs a smart file search
    const searchResults = await aiFileSearch.searchFiles(userId, query);

    // Log AI learning from search patterns
    await aiLearningManager.logAILearning(userId, "file_search_performed", { query, searchResults });

    res.status(200).json({ message: "File search completed", searchResults });
  } catch (error) {
    console.error("Error searching files:", error.message);
    res.status(500).json({ error: "Failed to perform file search." });
  }
});

/**
 * Route: GET /api/files/recent
 * Description: AI suggests recently accessed files.
 */
router.get("/recent", authenticate, async (req, res) => {
  const { userId } = req.user;

  try {
    console.log(`📂 AI Fetching Recently Accessed Files`);

    // AI retrieves recently accessed files for quick retrieval
    const recentFiles = await aiFileSearch.getRecentFiles(userId);

    res.status(200).json({ message: "Recent files retrieved successfully", recentFiles });
  } catch (error) {
    console.error("Error retrieving recent files:", error.message);
    res.status(500).json({ error: "Failed to retrieve recent files." });
  }
});

/**
 * Route: GET /api/files/popular
 * Description: AI suggests frequently used files based on user behavior.
 */
router.get("/popular", authenticate, async (req, res) => {
  const { userId } = req.user;

  try {
    console.log(`🔥 AI Fetching Most Frequently Accessed Files`);

    // AI determines most frequently used files for quick access
    const popularFiles = await aiFileSearch.getPopularFiles(userId);

    res.status(200).json({ message: "Popular files retrieved successfully", popularFiles });
  } catch (error) {
    console.error("Error retrieving popular files:", error.message);
    res.status(500).json({ error: "Failed to retrieve popular files." });
  }
});

/**
 * Route: GET /api/files/suggested
 * Description: AI predicts files users might need next.
 */
router.get("/suggested", authenticate, async (req, res) => {
  const { userId } = req.user;

  try {
    console.log(`🤖 AI Predicting Files You Might Need Next`);

    // AI predicts files the user might need based on past behavior
    const suggestedFiles = await aiFileSearch.getSuggestedFiles(userId);

    res.status(200).json({ message: "Suggested files retrieved successfully", suggestedFiles });
  } catch (error) {
    console.error("Error retrieving suggested files:", error.message);
    res.status(500).json({ error: "Failed to retrieve suggested files." });
  }
});

/**
 * Route: POST /api/files/index
 * Description: AI indexes new or updated files for better searchability.
 */
router.post("/index", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.body;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required." });
  }

  try {
    console.log(`📊 AI Indexing File: ${fileId}`);

    // AI indexes the file for enhanced search results
    const indexingStatus = await aiFileSearch.indexFile(userId, fileId);

    // Log AI learning from indexing
    await aiLearningManager.logAILearning(userId, "file_indexed", { fileId, indexingStatus });

    res.status(200).json({ message: "File indexed successfully", indexingStatus });
  } catch (error) {
    console.error("Error indexing file:", error.message);
    res.status(500).json({ error: "Failed to index file." });
  }
});

module.exports = router;
