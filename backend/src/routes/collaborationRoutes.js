// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/collaborationRoutes.js

const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const aiCollaboration = require("../ai/aiCollaboration");
const aiLearningManager = require("../ai/aiLearningManager");

const router = express.Router();

/**
 * Route: POST /api/collaboration/start
 * Description: AI initializes a real-time collaboration session.
 */
router.post("/start", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId, collaborators } = req.body;

  if (!fileId || !Array.isArray(collaborators)) {
    return res.status(400).json({ error: "File ID and list of collaborators are required." });
  }

  try {
    console.log(`🔄 AI Starting Collaboration for File: ${fileId}`);

    // AI initializes real-time collaboration session
    const session = await aiCollaboration.startSession(userId, fileId, collaborators);

    // AI logs learning to improve collaboration tracking
    await aiLearningManager.logAILearning(userId, "collaboration_started", { fileId, collaborators });

    res.status(200).json({ message: "Collaboration session started successfully", session });
  } catch (error) {
    console.error("Error starting collaboration session:", error.message);
    res.status(500).json({ error: "Failed to start collaboration session." });
  }
});

/**
 * Route: POST /api/collaboration/update
 * Description: AI tracks real-time changes in the collaboration session.
 */
router.post("/update", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId, changes } = req.body;

  if (!fileId || !changes) {
    return res.status(400).json({ error: "File ID and change data are required." });
  }

  try {
    console.log(`📝 AI Tracking Changes for File: ${fileId}`);

    // AI tracks and records changes in the collaboration session
    const updateStatus = await aiCollaboration.trackChanges(userId, fileId, changes);

    // AI logs learning to enhance change tracking
    await aiLearningManager.logAILearning(userId, "collaboration_updated", { fileId, changes });

    res.status(200).json({ message: "Changes tracked successfully", updateStatus });
  } catch (error) {
    console.error("Error tracking collaboration changes:", error.message);
    res.status(500).json({ error: "Failed to track collaboration changes." });
  }
});

/**
 * Route: POST /api/collaboration/end
 * Description: AI finalizes a collaboration session and saves the final version.
 */
router.post("/end", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.body;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required." });
  }

  try {
    console.log(`✅ AI Ending Collaboration for File: ${fileId}`);

    // AI finalizes collaboration and saves the latest version
    const finalVersion = await aiCollaboration.endSession(userId, fileId);

    // AI logs learning to improve future collaborations
    await aiLearningManager.logAILearning(userId, "collaboration_ended", { fileId, finalVersion });

    res.status(200).json({ message: "Collaboration session ended successfully", finalVersion });
  } catch (error) {
    console.error("Error ending collaboration session:", error.message);
    res.status(500).json({ error: "Failed to end collaboration session." });
  }
});

/**
 * Route: GET /api/collaboration/history
 * Description: AI retrieves collaboration history for a file.
 */
router.get("/history", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.query;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required." });
  }

  try {
    console.log(`📜 AI Fetching Collaboration History for File: ${fileId}`);

    // AI retrieves past collaboration sessions
    const history = await aiCollaboration.getCollaborationHistory(userId, fileId);

    res.status(200).json({ message: "Collaboration history retrieved successfully", history });
  } catch (error) {
    console.error("Error retrieving collaboration history:", error.message);
    res.status(500).json({ error: "Failed to retrieve collaboration history." });
  }
});

module.exports = router;
