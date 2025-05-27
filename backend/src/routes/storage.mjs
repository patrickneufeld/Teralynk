// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/storageRoutes.js

import express from "express";
import formidable from "formidable";
import fs from "fs";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { requireAuth } from "../middleware/authMiddleware.mjs"; // Corrected import
import { getStorageClient, listAvailableStorageProviders } from "../config/storageConfig.mjs"; // Corrected import
import { analyzeFileContent } from "../ai/aiFileManager.mjs"; // Corrected named import
import * as aiStorageOptimizer from "../ai/aiStorageOptimizer.mjs"; // Corrected named import
import { logAILearning } from "../ai/aiLearningManager.mjs"; // Corrected named import
import { 
  determineBestStorageProvider, 
  migrateFileToAvailableStorage, 
  analyzeStorageEfficiency, 
  improveStorageAI 
} from "../ai/aiStorageOptimizer.mjs"; // Corrected import

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
      const aiMetadata = await analyzeFileContent(bestProvider, file.originalFilename); // Corrected use of named import

      // Log AI learning
      await logAILearning(userId, "file_uploaded", { // Corrected to use named import for logAILearning
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
    await logAILearning(userId, "file_organization", { organizationResult });

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
    await logAILearning("platform", "new_storage_provider_added", { providerName });

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

export default router;
