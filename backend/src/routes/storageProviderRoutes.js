// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/storageProviderRoutes.js

import express from "express";
const { authenticate } = require("../middleware/authMiddleware");
const {
  listAvailableStorageProviders,
  addNewStorageProvider,
  removeStorageProvider,
} = require("../config/dynamicStorageConfig");
import aiLearningManager from "../ai/aiLearningManager";

const router = express.Router();

/**
 * Route: GET /api/storage/providers
 * Description: Get a list of all available storage providers.
 */
router.get("/providers", authenticate, async (req, res) => {
  try {
    const providers = listAvailableStorageProviders();
    res.status(200).json({ message: "Available storage providers retrieved.", providers });
  } catch (error) {
    console.error("Error retrieving storage providers:", error.message);
    res.status(500).json({ error: "Failed to retrieve storage providers." });
  }
});

/**
 * Route: POST /api/storage/add
 * Description: Add a new storage provider dynamically.
 */
router.post("/add", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { providerName, config } = req.body;

  if (!providerName || !config) {
    return res.status(400).json({ error: "Provider name and configuration are required." });
  }

  try {
    addNewStorageProvider(providerName, config);
    
    // AI logs new provider addition
    await aiLearningManager.logAILearning(userId, "new_storage_added", { providerName, config });

    res.status(200).json({ message: `Storage provider '${providerName}' added successfully.` });
  } catch (error) {
    console.error("Error adding new storage provider:", error.message);
    res.status(500).json({ error: "Failed to add storage provider." });
  }
});

/**
 * Route: DELETE /api/storage/remove
 * Description: Remove an existing storage provider.
 */
router.delete("/remove", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { providerName } = req.body;

  if (!providerName) {
    return res.status(400).json({ error: "Provider name is required." });
  }

  try {
    removeStorageProvider(providerName);
    
    // AI logs storage provider removal
    await aiLearningManager.logAILearning(userId, "storage_removed", { providerName });

    res.status(200).json({ message: `Storage provider '${providerName}' removed successfully.` });
  } catch (error) {
    console.error("Error removing storage provider:", error.message);
    res.status(500).json({ error: "Failed to remove storage provider." });
  }
});

module.exports = router;
