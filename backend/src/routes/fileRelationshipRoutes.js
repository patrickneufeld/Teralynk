// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/fileRelationshipRoutes.js

const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const aiFileRelationship = require("../ai/aiFileRelationship");
const aiLearningManager = require("../ai/aiLearningManager");

const router = express.Router();

/**
 * Route: GET /api/files/related
 * Description: AI identifies related files based on content and user activity.
 */
router.get("/related", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.query;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required." });
  }

  try {
    console.log(`🔗 AI Finding Related Files for File: ${fileId}`);

    // AI finds related files based on content similarity and user interactions
    const relatedFiles = await aiFileRelationship.findRelatedFiles(userId, fileId);

    res.status(200).json({ message: "Related files retrieved successfully", relatedFiles });
  } catch (error) {
    console.error("Error retrieving related files:", error.message);
    res.status(500).json({ error: "Failed to retrieve related files." });
  }
});

/**
 * Route: GET /api/files/interlink
 * Description: AI suggests file interlinking to enhance navigation.
 */
router.get("/interlink", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.query;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required." });
  }

  try {
    console.log(`🧩 AI Suggesting File Interlinks for File: ${fileId}`);

    // AI recommends interlinking files based on relationships
    const interlinkedFiles = await aiFileRelationship.suggestFileInterlinks(userId, fileId);

    // Log AI learning from file interlinking
    await aiLearningManager.logAILearning(userId, "file_interlinked", { fileId, interlinkedFiles });

    res.status(200).json({ message: "File interlinks suggested successfully", interlinkedFiles });
  } catch (error) {
    console.error("Error suggesting file interlinks:", error.message);
    res.status(500).json({ error: "Failed to suggest file interlinks." });
  }
});

/**
 * Route: GET /api/files/network
 * Description: AI generates a file relationship graph.
 */
router.get("/network", authenticate, async (req, res) => {
  const { userId } = req.user;

  try {
    console.log(`📊 AI Creating File Relationship Graph for User: ${userId}`);

    // AI generates a network graph of connected files
    const fileNetwork = await aiFileRelationship.generateFileNetwork(userId);

    res.status(200).json({ message: "File relationship graph generated", fileNetwork });
  } catch (error) {
    console.error("Error generating file network:", error.message);
    res.status(500).json({ error: "Failed to generate file network." });
  }
});

module.exports = router;
