// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/fileAnalysisRoutes.js

const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const aiFileAnalyzer = require("../ai/aiFileAnalyzer");
const aiLearningManager = require("../ai/aiLearningManager");

const router = express.Router();

/**
 * Route: POST /api/files/analyze
 * Description: AI analyzes file content to categorize and extract key data.
 */
router.post("/analyze", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.body;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required." });
  }

  try {
    console.log(`📂 AI Analyzing File: ${fileId}`);

    // AI processes file content and extracts relevant data
    const analysisResult = await aiFileAnalyzer.analyzeFile(userId, fileId);

    // Log AI learning from file analysis
    await aiLearningManager.logAILearning(userId, "file_analyzed", { fileId, analysisResult });

    res.status(200).json({ message: "File analysis completed", analysisResult });
  } catch (error) {
    console.error("Error analyzing file:", error.message);
    res.status(500).json({ error: "Failed to analyze file." });
  }
});

/**
 * Route: GET /api/files/search
 * Description: AI enables intelligent search based on file content.
 */
router.get("/search", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Search query is required." });
  }

  try {
    console.log(`🔍 AI Searching Files for Query: ${query}`);

    // AI searches files based on content relevance
    const searchResults = await aiFileAnalyzer.searchFiles(userId, query);

    res.status(200).json({ message: "Search results retrieved", searchResults });
  } catch (error) {
    console.error("Error searching files:", error.message);
    res.status(500).json({ error: "Failed to search files." });
  }
});

/**
 * Route: GET /api/files/duplicates
 * Description: AI detects duplicate files and suggests actions.
 */
router.get("/duplicates", authenticate, async (req, res) => {
  const { userId } = req.user;

  try {
    console.log(`📌 AI Detecting Duplicate Files for User: ${userId}`);

    // AI scans for duplicate files and suggests actions
    const duplicateFiles = await aiFileAnalyzer.detectDuplicates(userId);

    res.status(200).json({ message: "Duplicate files detected", duplicateFiles });
  } catch (error) {
    console.error("Error detecting duplicates:", error.message);
    res.status(500).json({ error: "Failed to detect duplicate files." });
  }
});

/**
 * Route: POST /api/files/auto-categorize
 * Description: AI automatically categorizes files based on content and usage.
 */
router.post("/auto-categorize", authenticate, async (req, res) => {
  const { userId } = req.user;

  try {
    console.log(`📂 AI Auto-Categorizing Files for User: ${userId}`);

    // AI categorizes files into relevant folders
    const categorizationResults = await aiFileAnalyzer.autoCategorizeFiles(userId);

    // Log AI learning from categorization
    await aiLearningManager.logAILearning(userId, "files_categorized", { categorizationResults });

    res.status(200).json({ message: "Files auto-categorized successfully", categorizationResults });
  } catch (error) {
    console.error("Error auto-categorizing files:", error.message);
    res.status(500).json({ error: "Failed to auto-categorize files." });
  }
});

module.exports = router;
