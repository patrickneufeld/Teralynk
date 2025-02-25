// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/fileVersioningRoutes.js

const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const aiFileVersioning = require("../ai/aiFileVersioning");
const aiLearningManager = require("../ai/aiLearningManager");

const router = express.Router();

/**
 * Route: POST /api/files/version
 * Description: AI detects changes & automatically versions files.
 */
router.post("/version", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId, newContent, versionDescription, keywordReplacements } = req.body;

  if (!fileId || !newContent) {
    return res.status(400).json({ error: "File ID and new content are required." });
  }

  try {
    console.log(`📝 AI Auto-Versioning File: ${fileId}`);

    // AI detects changes and creates a new version of the file
    const versionInfo = await aiFileVersioning.createFileVersion(userId, fileId, newContent, versionDescription, keywordReplacements);

    // AI logs learning experience for self-improvement
    await aiLearningManager.logAILearning(userId, "file_versioned", { fileId, versionInfo });

    res.status(200).json({ message: "New file version created successfully", versionInfo });
  } catch (error) {
    console.error("Error creating file version:", error.message);
    res.status(500).json({ error: "Failed to create file version." });
  }
});

/**
 * Route: GET /api/files/history
 * Description: AI retrieves full version history and suggests best versions.
 */
router.get("/history", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.query;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required." });
  }

  try {
    console.log(`📜 AI Fetching Version History for File: ${fileId}`);

    // AI retrieves file version history
    const versionHistory = await aiFileVersioning.getFileHistory(userId, fileId);

    // AI suggests the best version based on collaboration & edits
    const bestVersionSuggestion = await aiFileVersioning.suggestBestVersion(userId, fileId);

    res.status(200).json({ 
      message: "File version history retrieved successfully", 
      versionHistory,
      suggestedBestVersion: bestVersionSuggestion
    });
  } catch (error) {
    console.error("Error retrieving file history:", error.message);
    res.status(500).json({ error: "Failed to retrieve file history." });
  }
});

/**
 * Route: POST /api/files/restore
 * Description: AI intelligently restores previous file versions.
 */
router.post("/restore", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId, versionId } = req.body;

  if (!fileId || !versionId) {
    return res.status(400).json({ error: "File ID and version ID are required." });
  }

  try {
    console.log(`🔄 AI Restoring File: ${fileId} to Version: ${versionId}`);

    // AI restores the file to the selected version
    const restoredFile = await aiFileVersioning.restoreFileVersion(userId, fileId, versionId);

    // AI learns from rollback actions
    await aiLearningManager.logAILearning(userId, "file_restored", { fileId, versionId });

    res.status(200).json({ message: "File restored to previous version", restoredFile });
  } catch (error) {
    console.error("Error restoring file:", error.message);
    res.status(500).json({ error: "Failed to restore file version." });
  }
});

/**
 * Route: GET /api/files/compare
 * Description: AI compares two file versions, highlights differences, and suggests the best version.
 */
router.get("/compare", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId, versionId1, versionId2 } = req.query;

  if (!fileId || !versionId1 || !versionId2) {
    return res.status(400).json({ error: "File ID and two version IDs are required." });
  }

  try {
    console.log(`🔍 AI Comparing File Versions: ${versionId1} vs ${versionId2}`);

    // AI compares two versions of a file
    const comparisonResult = await aiFileVersioning.compareFileVersions(userId, fileId, versionId1, versionId2);

    // AI suggests which version is better based on edits and user behavior
    const bestVersion = await aiFileVersioning.suggestBestVersion(userId, fileId);

    res.status(200).json({ 
      message: "File versions compared successfully", 
      comparisonResult, 
      suggestedBestVersion: bestVersion 
    });
  } catch (error) {
    console.error("Error comparing file versions:", error.message);
    res.status(500).json({ error: "Failed to compare file versions." });
  }
});

/**
 * Route: POST /api/files/auto-save
 * Description: AI automatically saves versions at regular intervals.
 */
router.post("/auto-save", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId, currentContent, versionDescription, keywordReplacements } = req.body;

  if (!fileId || !currentContent) {
    return res.status(400).json({ error: "File ID and current content are required." });
  }

  try {
    console.log(`💾 AI Auto-Saving File: ${fileId}`);

    // AI auto-saves file without user intervention
    const autoSavedVersion = await aiFileVersioning.autoSaveVersion(userId, fileId, currentContent, versionDescription, keywordReplacements);

    // AI logs learning to improve auto-save behavior
    await aiLearningManager.logAILearning(userId, "file_auto_saved", { fileId, autoSavedVersion });

    res.status(200).json({ message: "File auto-saved successfully", autoSavedVersion });
  } catch (error) {
    console.error("Error auto-saving file:", error.message);
    res.status(500).json({ error: "Failed to auto-save file." });
  }
});

module.exports = router;
