// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/storageRoutes.js

const express = require("express");
const formidable = require("formidable");
const fs = require("fs");
const { authenticate } = require("../middleware/authMiddleware");
const { getStorageClient, listAvailableStorageProviders } = require("../config/storageConfig");
const aiFileManager = require("../ai/aiFileManager");
const aiStorageOptimizer = require("../ai/aiStorageOptimizer");
const aiLearningManager = require("../ai/aiLearningManager");

const router = express.Router();

/**
 * Route: POST /api/storage/upload
 * Description: Upload a file with AI choosing the best storage provider.
 */
router.post("/upload", authenticate, async (req, res) => {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Error parsing the file upload form." });
    }

    const { userId } = req.user;
    const file = files.file;
    const preferredProviders = fields.preferredProviders || ["s3", "googleDrive", "dropbox"];

    if (!file) {
      return res.status(400).json({ error: "No file provided." });
    }

    try {
      // AI determines the best provider based on storage availability & user preference
      const bestProvider = await aiStorageOptimizer.determineBestStorageProvider(userId, file.size, preferredProviders);

      if (!bestProvider) {
        return res.status(500).json({ error: "No storage provider available with enough space." });
      }

      const storageClient = getStorageClient(bestProvider);
      const params = {
        Bucket: storageClient.bucket,
        Key: `users/${userId}/${file.originalFilename}`,
        Body: fs.createReadStream(file.filepath),
        ContentType: file.mimetype,
      };

      await storageClient.client.send(new PutObjectCommand(params));

      // AI Analyzes the file content & categorizes it
      const aiMetadata = await aiFileManager.analyzeFileContent(bestProvider, file.originalFilename);

      // Log AI learning
      await aiLearningManager.logAILearning(userId, "file_uploaded", {
        fileName: file.originalFilename,
        provider: bestProvider,
        aiMetadata,
      });

      res.status(200).json({ message: "File uploaded successfully", provider: bestProvider, aiMetadata });
    } catch (error) {
      console.error("Error uploading file:", error.message);
      res.status(500).json({ error: "Failed to upload file." });
    }
  });
});

/**
 * Route: POST /api/storage/migrate
 * Description: AI automatically migrates a file to an available storage provider if needed.
 */
router.post("/migrate", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileName, currentProvider } = req.body;

  if (!fileName || !currentProvider) {
    return res.status(400).json({ error: "File name and current provider are required." });
  }

  try {
    const newProvider = await aiStorageOptimizer.migrateFileToAvailableStorage(userId, fileName, currentProvider);

    if (!newProvider) {
      return res.status(500).json({ error: "No available storage provider to migrate to." });
    }

    res.status(200).json({ message: `File migrated to ${newProvider}.` });
  } catch (error) {
    console.error("Error migrating file:", error.message);
    res.status(500).json({ error: "Failed to migrate file." });
  }
});

/**
 * Route: GET /api/storage/organize
 * Description: AI automatically organizes files based on learned behavior.
 */
router.get("/organize", authenticate, async (req, res) => {
  const { userId } = req.user;

  try {
    const organizationResult = await aiFileManager.autoOrganizeFiles(userId);
    await aiLearningManager.logAILearning(userId, "file_organization", { organizationResult });

    res.status(200).json({ message: "Files organized successfully", organizationResult });
  } catch (error) {
    console.error("Error organizing files:", error.message);
    res.status(500).json({ error: "AI failed to organize files." });
  }
});

/**
 * Route: GET /api/storage/providers
 * Description: List all available storage providers (including user-added ones).
 */
router.get("/providers", async (req, res) => {
  try {
    const providers = listAvailableStorageProviders();
    res.status(200).json({ providers });
  } catch (error) {
    console.error("Error listing storage providers:", error.message);
    res.status(500).json({ error: "Failed to list storage providers." });
  }
});

/**
 * Route: POST /api/storage/add-provider
 * Description: Allows users to add new storage providers dynamically.
 */
router.post("/add-provider", authenticate, async (req, res) => {
  const { providerName, apiUrl, credentials } = req.body;

  if (!providerName || !apiUrl || !credentials) {
    return res.status(400).json({ error: "Provider name, API URL, and credentials are required." });
  }

  try {
    // Register new storage provider
    const result = await aiFileManager.registerNewStorageProvider(providerName, apiUrl, credentials);
    await aiLearningManager.logAILearning("platform", "new_storage_provider_added", { providerName });

    res.status(200).json({ message: "New storage provider added successfully", result });
  } catch (error) {
    console.error("Error adding storage provider:", error.message);
    res.status(500).json({ error: "Failed to add new storage provider." });
  }
});

module.exports = router;
