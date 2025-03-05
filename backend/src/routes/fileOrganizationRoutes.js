import express from "express";
const { authenticate } = require("../middleware/authMiddleware");
import aiFileOrganization from "../ai/aiFileOrganization";
import aiLearningManager from "../ai/aiLearningManager";
import fs from "fs";
const { getStorageClient } = require("../config/dynamicStorageManager"); // Added dynamic storage
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");

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
 * Route: POST /api/files/replace
 * Description: Search and replace keywords in a file and save as a new file.
 */
router.post("/replace", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId, searchKeyword, replaceKeyword } = req.body;

  if (!fileId || !searchKeyword || !replaceKeyword) {
    return res.status(400).json({ error: "File ID, searchKeyword, and replaceKeyword are required." });
  }

  try {
    console.log(`🔍 Searching for '${searchKeyword}' in file '${fileId}'`);

    // Retrieve the file from storage (this assumes that we are pulling the file from S3)
    const storageClient = getStorageClient("s3"); // Adjust as needed for other storage providers
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: `users/${userId}/${fileId}`,
    };

    const file = await storageClient.client.send(new GetObjectCommand(params));

    // Read and replace content in the file
    const fileContent = await file.Body.text();
    const updatedContent = fileContent.replace(new RegExp(searchKeyword, "g"), replaceKeyword);

    // Save the modified content as a new file
    const newFileName = `${fileId}_updated`;
    const newParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: `users/${userId}/${newFileName}`,
      Body: updatedContent,
      ContentType: "text/plain", // Adjust MIME type accordingly
    };

    await storageClient.client.send(new PutObjectCommand(newParams));

    res.status(200).json({ message: "File updated and saved successfully", newFileName });
    
    // Log AI learning from keyword replacement
    await aiLearningManager.logAILearning(userId, "file_keyword_replacement", { fileId, searchKeyword, replaceKeyword });

  } catch (error) {
    console.error("Error replacing keywords in file:", error.message);
    res.status(500).json({ error: "Failed to replace keywords in the file." });
  }
});

/**
 * Route: POST /api/files/copy
 * Description: Copy a file and save it as a new file.
 */
router.post("/copy", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.body;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required." });
  }

  try {
    console.log(`📋 Copying file '${fileId}'`);

    // Retrieve the file from storage (this assumes that we are pulling the file from S3)
    const storageClient = getStorageClient("s3"); // Adjust as needed for other storage providers
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: `users/${userId}/${fileId}`,
    };

    const file = await storageClient.client.send(new GetObjectCommand(params));

    // Save the copied file as a new file
    const newFileName = `${fileId}_copy`;
    const newParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: `users/${userId}/${newFileName}`,
      Body: file.Body,
      ContentType: "application/octet-stream", // Adjust MIME type accordingly
    };

    await storageClient.client.send(new PutObjectCommand(newParams));

    res.status(200).json({ message: "File copied successfully", newFileName });

    // Log AI learning from file copy
    await aiLearningManager.logAILearning(userId, "file_copied", { fileId, newFileName });

  } catch (error) {
    console.error("Error copying file:", error.message);
    res.status(500).json({ error: "Failed to copy the file." });
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

// Other routes (recent, popular, etc.) remain unchanged

module.exports = router;
