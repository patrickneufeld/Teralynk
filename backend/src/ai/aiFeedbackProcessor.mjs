import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/ai/aiFeedbackProcessor.js

import { getRecentInteractions } from "../config/db.mjs";
import { sendAIQueryToQueue } from "../config/rabbitmq.mjs";

/**
 * ✅ Processes AI feedback to refine future responses.
 * Enhances AI response quality based on user interactions.
 */
export const processAIQueryFeedback = async () => {
  if (isKillSwitchEnabled()) return;
  try {
    console.log("🧠 Processing AI Query Feedback...");

    // Retrieve AI interaction history
    const pastInteractions = await getRecentInteractions();
    if (!pastInteractions.length) {
      console.log("⚠️ No past feedback available for processing.");
      return;
    }

    // Prepare AI learning prompt
    const aiLearningPrompt = {
      query: "Analyze past queries and their feedback. Improve response accuracy.",
      data: pastInteractions,
    };

    // Send feedback-based improvement request to queue
    await sendAIQueryToQueue(aiLearningPrompt);

    console.log("✅ AI Feedback Processing Completed!");
  } catch (error) {
    console.error("❌ Error processing AI feedback:", error);
  }
};
