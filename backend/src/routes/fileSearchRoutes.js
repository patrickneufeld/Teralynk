import express from "express";
const { authenticate } = require("../middleware/authMiddleware");
import aiFileSearch from "../ai/aiFileSearch";
import aiLearningManager from "../ai/aiLearningManager";
import fs from "fs";
const { getStorageClient } = require("../config/dynamicStorageManager"); // Added dynamic storage
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");

const router = express.Router();

/**
 * Route: POST /api/files/replace
 * Description: Replace keywords in a file and save as a new file.
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

// Other routes (recent, popular, etc.) remain unchanged

module.exports = router;
