// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/filePreviewRoutes.js

import express from "express";
const { authenticate } = require("../middleware/authMiddleware");
import aiFilePreview from "../ai/aiFilePreview";
import aiLearningManager from "../ai/aiLearningManager";

const router = express.Router();

/**
 * Route: GET /api/files/preview
 * Description: AI generates a preview of a file without downloading it.
 */
router.get("/preview", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.query;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required." });
  }

  try {
    console.log(`🖼️ AI Generating Preview for File: ${fileId}`);

    // AI extracts key information from the file
    const filePreview = await aiFilePreview.generatePreview(userId, fileId);

    res.status(200).json({ message: "File preview generated successfully", filePreview });
  } catch (error) {
    console.error("Error generating file preview:", error.message);
    res.status(500).json({ error: "Failed to generate file preview." });
  }
});

/**
 * Route: GET /api/files/summary
 * Description: AI generates a smart summary of the file content.
 */
router.get("/summary", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.query;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required." });
  }

  try {
    console.log(`📄 AI Summarizing File Content for: ${fileId}`);

    // AI summarizes the document content
    const fileSummary = await aiFilePreview.generateSummary(userId, fileId);

    // Log AI learning from summarization
    await aiLearningManager.logAILearning(userId, "file_summary_generated", { fileId, fileSummary });

    res.status(200).json({ message: "File summary generated successfully", fileSummary });
  } catch (error) {
    console.error("Error generating file summary:", error.message);
    res.status(500).json({ error: "Failed to generate file summary." });
  }
});

/**
 * Route: GET /api/files/visual-insights
 * Description: AI generates visual insights such as charts and graphs.
 */
router.get("/visual-insights", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.query;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required." });
  }

  try {
    console.log(`📊 AI Generating Visual Insights for File: ${fileId}`);

    // AI generates charts or graphs based on file data
    const visualData = await aiFilePreview.generateVisualInsights(userId, fileId);

    res.status(200).json({ message: "Visual insights generated successfully", visualData });
  } catch (error) {
    console.error("Error generating visual insights:", error.message);
    res.status(500).json({ error: "Failed to generate visual insights." });
  }
});

/**
 * Route: GET /api/files/metadata
 * Description: AI extracts metadata from files for better organization.
 */
router.get("/metadata", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.query;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required." });
  }

  try {
    console.log(`🔎 AI Extracting Metadata for File: ${fileId}`);

    // AI extracts metadata from the file
    const metadata = await aiFilePreview.extractMetadata(userId, fileId);

    res.status(200).json({ message: "File metadata retrieved successfully", metadata });
  } catch (error) {
    console.error("Error retrieving file metadata:", error.message);
    res.status(500).json({ error: "Failed to retrieve file metadata." });
  }
});

module.exports = router;
