// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/fileOrganizationRoutes.js

const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const aiFileOrganization = require("../ai/aiFileOrganization");
const aiLearningManager = require("../ai/aiLearningManager");

const router = express.Router();

/**
 * Route: POST /api/files/organize
 * Description: AI automatically organizes files into categories.
 */
router.post("/organize", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.body;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required." });
  }

  try {
    console.log(`📂 AI Organizing File: ${fileId}`);

    // AI categorizes the file based on content and metadata
    const categoryInfo = await aiFileOrganization.categorizeFile(userId, fileId);

    // Log AI learning from categorization
    await aiLearningManager.logAILearning(userId, "file_categorized", { fileId, categoryInfo });

    res.status(200).json({ message: "File categorized successfully", categoryInfo });
  } catch (error) {
    console.error("Error categorizing file:", error.message);
    res.status(500).json({ error: "Failed to categorize file." });
  }
});

/**
 * Route: GET /api/files/category
 * Description: Retrieve AI-assigned category for a file.
 */
router.get("/category", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.query;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required." });
  }

  try {
    console.log(`📌 AI Fetching Category for File: ${fileId}`);

    // AI retrieves the file's assigned category
    const fileCategory = await aiFileOrganization.getFileCategory(userId, fileId);

    res.status(200).json({ message: "File category retrieved successfully", fileCategory });
  } catch (error) {
    console.error("Error retrieving file category:", error.message);
    res.status(500).json({ error: "Failed to retrieve file category." });
  }
});

/**
 * Route: POST /api/files/find-duplicates
 * Description: AI detects duplicate files and suggests actions.
 */
router.post("/find-duplicates", authenticate, async (req, res) => {
  const { userId } = req.user;

  try {
    console.log(`🔍 AI Scanning for Duplicate Files`);

    // AI detects duplicate files and suggests actions
    const duplicateFiles = await aiFileOrganization.detectDuplicates(userId);

    res.status(200).json({ message: "Duplicate file scan completed", duplicateFiles });
  } catch (error) {
    console.error("Error detecting duplicate files:", error.message);
    res.status(500).json({ error: "Failed to detect duplicate files." });
  }
});

/**
 * Route: POST /api/files/merge-duplicates
 * Description: AI merges duplicate files intelligently.
 */
router.post("/merge-duplicates", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId1, fileId2 } = req.body;

  if (!fileId1 || !fileId2) {
    return res.status(400).json({ error: "Two file IDs are required for merging." });
  }

  try {
    console.log(`🛠️ AI Merging Duplicate Files: ${fileId1} & ${fileId2}`);

    // AI merges the duplicate files and retains necessary content
    const mergedFile = await aiFileOrganization.mergeDuplicateFiles(userId, fileId1, fileId2);

    // Log AI learning from merging duplicates
    await aiLearningManager.logAILearning(userId, "duplicate_files_merged", { fileId1, fileId2, mergedFile });

    res.status(200).json({ message: "Duplicate files merged successfully", mergedFile });
  } catch (error) {
    console.error("Error merging duplicate files:", error.message);
    res.status(500).json({ error: "Failed to merge duplicate files." });
  }
});

/**
 * Route: GET /api/files/smart-suggestions
 * Description: AI provides smart organization suggestions based on user patterns.
 */
router.get("/smart-suggestions", authenticate, async (req, res) => {
  const { userId } = req.user;

  try {
    console.log(`💡 AI Generating Smart Organization Suggestions`);

    // AI analyzes user behavior and suggests better organization strategies
    const organizationSuggestions = await aiFileOrganization.getSmartSuggestions(userId);

    res.status(200).json({ message: "Smart organization suggestions generated", organizationSuggestions });
  } catch (error) {
    console.error("Error generating organization suggestions:", error.message);
    res.status(500).json({ error: "Failed to generate smart suggestions." });
  }
});

module.exports = router;
