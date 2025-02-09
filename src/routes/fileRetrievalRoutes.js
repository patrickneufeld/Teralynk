// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/fileRetrievalRoutes.js

const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const { getStorageClient } = require("../config/storageConfig");
const aiFileManager = require("../ai/aiFileManager");
const aiLearningManager = require("../ai/aiLearningManager");

const router = express.Router();

/**
 * Route: GET /api/files/retrieve
 * Description: Fetch a file from the best storage provider determined by AI.
 */
router.get("/retrieve", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileName, provider } = req.query;

  if (!fileName) {
    return res.status(400).json({ error: "File name is required." });
  }

  try {
    let selectedProvider = provider;

    // If no provider specified, AI selects the best one
    if (!selectedProvider) {
      selectedProvider = await aiFileManager.getBestFileProvider(userId, fileName);
    }

    if (!selectedProvider) {
      return res.status(404).json({ error: "File not found in any storage provider." });
    }

    const storageClient = getStorageClient(selectedProvider);

    // AI logs retrieval learning
    await aiLearningManager.logAILearning(userId, "file_retrieved", {
      fileName,
      provider: selectedProvider,
    });

    res.status(200).json({ message: "File retrieved successfully", provider: selectedProvider });
  } catch (error) {
    console.error("Error retrieving file:", error.message);
    res.status(500).json({ error: "Failed to retrieve file." });
  }
});

/**
 * Route: GET /api/files/multi-retrieve
 * Description: Fetch all instances of a file across multiple storage providers.
 */
router.get("/multi-retrieve", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileName } = req.query;

  if (!fileName) {
    return res.status(400).json({ error: "File name is required." });
  }

  try {
    const fileLocations = await aiFileManager.findFileAcrossProviders(userId, fileName);

    if (fileLocations.length === 0) {
      return res.status(404).json({ error: "File not found in any storage provider." });
    }

    // AI logs retrieval learning
    await aiLearningManager.logAILearning(userId, "multi_file_retrieved", {
      fileName,
      providers: fileLocations,
    });

    res.status(200).json({ message: "File instances retrieved successfully", fileLocations });
  } catch (error) {
    console.error("Error retrieving file from multiple sources:", error.message);
    res.status(500).json({ error: "Failed to retrieve file from multiple sources." });
  }
});

module.exports = router;
