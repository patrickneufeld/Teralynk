// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/routes/aiCollaborationRoutes.js

import express from "express";
import { requireAuth } from "../middleware/authMiddleware.mjs";
import { shareAIQueryResults } from "../ai/aiCollaborationManager.mjs";

const router = express.Router();

/**
 * ✅ POST: Share AI Query Results in a Workspace
 */
router.post("/share", requireAuth, async (req, res) => {
  const { workspaceId, query, result } = req.body;

  if (!workspaceId || !query || !result) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    await shareAIQueryResults(workspaceId, query, result);
    res.status(200).json({ message: "AI Query results shared successfully." });
  } catch (error) {
    console.error("❌ Error sharing AI query results:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
