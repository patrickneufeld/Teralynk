// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/fileTaggingRoutes.js

import express from "express";
import { authenticate } from "../middleware/authMiddleware.mjs";
import aiFileTagger from "../ai/aiFileTagger.mjs";
import aiLearningManager from "../ai/aiLearningManager.mjs";

const router = express.Router();

/**
 * Route: POST /api/files/summarize
 * Description: AI generates a summary of the file content.
 */
router.post("/summarize", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.body;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required." });
  }

  try {
    console.log(`📄 AI Summarizing File: ${fileId}`);

    // AI generates a content summary for the file
    const summary = await aiFileTagger.summarizeFile(userId, fileId);

    // Log AI learning from summarization
    await aiLearningManager.logAILearning(userId, "file_summarized", { fileId, summary });

    res.status(200).json({ message: "File summarized successfully", summary });
  } catch (error) {
    console.error("Error summarizing file:", error.message);
    res.status(500).json({ error: "Failed to summarize file." });
  }
});

/**
 * Route: POST /api/files/auto-tag
 * Description: AI automatically generates relevant tags for the file.
 */
router.post("/auto-tag", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.body;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required." });
  }

  try {
    console.log(`🏷 AI Auto-Tagging File: ${fileId}`);

    // AI generates relevant metadata tags for the file
    const tags = await aiFileTagger.autoTagFile(userId, fileId);

    // Log AI learning from tagging
    await aiLearningManager.logAILearning(userId, "file_tagged", { fileId, tags });

    res.status(200).json({ message: "File auto-tagged successfully", tags });
  } catch (error) {
    console.error("Error auto-tagging file:", error.message);
    res.status(500).json({ error: "Failed to auto-tag file." });
  }
});

/**
 * Route: GET /api/files/get-tags
 * Description: Retrieve tags for a specific file.
 */
router.get("/get-tags", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.query;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required." });
  }

  try {
    console.log(`📌 AI Fetching Tags for File: ${fileId}`);

    // AI retrieves the tags associated with the file
    const tags = await aiFileTagger.getFileTags(userId, fileId);

    res.status(200).json({ message: "File tags retrieved successfully", tags });
  } catch (error) {
    console.error("Error retrieving file tags:", error.message);
    res.status(500).json({ error: "Failed to retrieve file tags." });
  }
});

/**
 * Route: POST /api/files/custom-tag
 * Description: Manually add a custom tag to a file.
 */
router.post("/custom-tag", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId, customTag } = req.body;

  if (!fileId || !customTag) {
    return res.status(400).json({ error: "File ID and custom tag are required." });
  }

  try {
    console.log(`➕ Adding Custom Tag to File: ${fileId}`);

    // AI allows the user to manually add custom tags
    const updatedTags = await aiFileTagger.addCustomTag(userId, fileId, customTag);

    res.status(200).json({ message: "Custom tag added successfully", updatedTags });
  } catch (error) {
    console.error("Error adding custom tag:", error.message);
    res.status(500).json({ error: "Failed to add custom tag." });
  }
});

export default router;
