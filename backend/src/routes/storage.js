// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/routes/storageRoutes.js

const express = require("express");
const formidable = require("formidable");
const fs = require("fs");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { requireAuth } = require("../middleware/authMiddleware"); // ✅ FIXED IMPORT
const { getStorageClient, listAvailableStorageProviders } = require("../config/storageConfig");
const aiFileManager = require("../ai/aiFileManager");
const aiStorageOptimizer = require("../ai/aiStorageOptimizer");
const aiLearningManager = require("../ai/aiLearningManager");

const router = express.Router();

/**
 * Route: POST /api/storage/upload
 * Description: Upload a file with AI selecting the best storage provider.
 */
router.post("/upload", requireAuth, async (req, res) => {
  try {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error parsing file upload:", err);
        return res.status(400).json({ error: "Error parsing file upload form." });
      }

      const { userId } = req.user;
      const file = files.file?.[0];
      const preferredProviders = fields.preferredProviders || ["s3", "googleDrive", "dropbox"];

      if (!file) {
        return res.status(400).json({ error: "No file provided." });
      }

      // AI determines the best provider
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

      // AI analyzes file content
      const aiMetadata = await aiFileManager.analyzeFileContent(bestProvider, file.originalFilename);

      // Log AI learning
      await aiLearningManager.logAILearning(userId, "file_uploaded", {
        fileName: file.originalFilename,
        provider: bestProvider,
        aiMetadata,
      });

      res.status(200).json({ message: "File uploaded successfully", provider: bestProvider, aiMetadata });
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file." });
  }
});

/**
 * Route: POST /api/storage/migrate
 * Description: AI migrates a file to a more optimal storage provider if needed.
 */
router.post("/migrate", requireAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { fileName, currentProvider } = req.body;

    if (!fileName || !currentProvider) {
      return res.status(400).json({ error: "File name and current provider are required." });
    }

    const newProvider = await aiStorageOptimizer.migrateFileToAvailableStorage(userId, fileName, currentProvider);
    if (!newProvider) {
      return res.status(500).json({ error: "No available storage provider to migrate to." });
    }

    res.status(200).json({ message: `File migrated to ${newProvider}.` });
  } catch (error) {
    console.error("Error migrating file:", error);
    res.status(500).json({ error: "Failed to migrate file." });
  }
});

/**
 * Route: GET /api/storage/organize
 * Description: AI organizes files based on user behavior and file types.
 */
router.get("/organize", requireAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const organizationResult = await aiFileManager.autoOrganizeFiles(userId);
    await aiLearningManager.logAILearning(userId, "file_organization", { organizationResult });

    res.status(200).json({ message: "Files organized successfully", organizationResult });
  } catch (error) {
    console.error("Error organizing files:", error);
    res.status(500).json({ error: "AI failed to organize files." });
  }
});

/**
 * Route: GET /api/storage/providers
 * Description: List all available storage providers (including user-added ones).
 */
router.get("/providers", requireAuth, async (req, res) => {
  try {
    const providers = listAvailableStorageProviders();
    res.status(200).json({ providers });
  } catch (error) {
    console.error("Error listing storage providers:", error);
    res.status(500).json({ error: "Failed to list storage providers." });
  }
});

/**
 * Route: POST /api/storage/add-provider
 * Description: Allows users to add custom storage providers dynamically.
 */
router.post("/add-provider", requireAuth, async (req, res) => {
  try {
    const { providerName, apiUrl, credentials } = req.body;
    if (!providerName || !apiUrl || !credentials) {
      return res.status(400).json({ error: "Provider name, API URL, and credentials are required." });
    }

    // Register new storage provider
    const result = await aiFileManager.registerNewStorageProvider(providerName, apiUrl, credentials);
    await aiLearningManager.logAILearning("platform", "new_storage_provider_added", { providerName });

    res.status(200).json({ message: "New storage provider added successfully", result });
  } catch (error) {
    console.error("Error adding storage provider:", error);
    res.status(500).json({ error: "Failed to add new storage provider." });
  }
});

/**
 * Route: GET /api/storage/user-files
 * Description: Fetch user-specific files stored across multiple providers.
 */
router.get("/user-files", requireAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const files = await aiFileManager.getUserFiles(userId);
    res.status(200).json({ message: "User files fetched successfully", files });
  } catch (error) {
    console.error("Error fetching user files:", error);
    res.status(500).json({ error: "Failed to fetch user files." });
  }
});

/**
 * Route: DELETE /api/storage/delete
 * Description: Delete a file from the selected storage provider.
 */
router.delete("/delete", requireAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { fileName, provider } = req.body;

    if (!fileName || !provider) {
      return res.status(400).json({ error: "File name and provider are required." });
    }

    const deleteResult = await aiFileManager.deleteFile(userId, fileName, provider);
    if (!deleteResult.success) {
      return res.status(500).json({ error: "Failed to delete file." });
    }

    res.status(200).json({ message: "File deleted successfully." });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file." });
  }
});

module.exports = router;
