// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/ai/aiCollaborationManager.js

import { broadcastUpdate } from "../config/websocketConfig.js";
import { logAILearning } from "./aiLearningManager.js";

/**
 * ✅ Store & Share AI Query Results in a Collaborative Workspace
 * @param {string} workspaceId - The shared workspace identifier.
 * @param {string} query - The AI query being executed.
 * @param {object} result - The AI-generated response.
 */
export const shareAIQueryResults = async (workspaceId, query, result) => {
  try {
    // Broadcast AI results to all workspace members
    await broadcastUpdate(workspaceId, {
      event: "ai_query_result",
      query,
      result,
    });

    // Log AI query for learning purposes
    await logAILearning("system", "collaborative-ai-query", { workspaceId, query });

    console.log(`✅ AI Query Results Shared to Workspace: ${workspaceId}`);
  } catch (error) {
    console.error("❌ Error sharing AI query results:", error.message);
  }
};
