import express from "express";
const { authenticate } = require("../middleware/authMiddleware");
import aiFileAnalyzer from "../ai/aiFileAnalyzer";
import aiFileOrganization from "../ai/aiFileOrganization";
import aiLearningManager from "../ai/aiLearningManager";
import fs from "fs";
const { getStorageClient } = require("../config/dynamicStorageManager"); // Added dynamic storage
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");

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
