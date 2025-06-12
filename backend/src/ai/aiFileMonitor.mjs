import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// File Path: /Users/patrick/Projects/Teralynk/backend/src/ai/aiFileMonitor.js

const { getAllStorageProviders, updateTotalStorage } = await import("../config/dynamicStorageManager.js");
import aiLearningManager from "./aiLearningManager.mjs";
import axios from "axios";

/**
 * Continuously monitors file activities across all connected storage providers.
 * @param {string} userId - The user for whom files are being monitored.
 * @returns {object} - Summary of monitored file activity.
 */
const monitorFileActivity = async (userId) => {
  if (isKillSwitchEnabled()) return;
  console.log(`📡 Monitoring file activity for user: ${userId}`);

  const monitoredActivity = {};
  const storageProviders = getAllStorageProviders();
  await updateTotalStorage();

  for (const provider in storageProviders) {
    try {
      const response = await axios.get(`${storageProviders[provider].apiUrl}/file-activity`, {
        headers: { Authorization: `Bearer ${storageProviders[provider].credentials.apiKey || ""}` },
      });

      monitoredActivity[provider] = response.data.activityLog || [];
    } catch (error) {
      console.warn(`⚠️ Unable to monitor file activity for provider '${provider}': ${error.message}`);
    }
  }

  // AI Logs Learning: Store activity insights for platform-wide learning
  await aiLearningManager.logAILearning(userId, "file_activity_monitoring", { monitoredActivity });

  return { monitoredActivity };
};

/**
 * AI-driven anomaly detection to identify suspicious or unexpected file actions.
 * @param {string} userId - The user for whom anomalies are detected.
 * @returns {object} - Identified anomalies and recommendations.
 */
const detectFileAnomalies = async (userId) => {
  if (isKillSwitchEnabled()) return;
  console.log(`🚨 AI scanning for file anomalies for user: ${userId}`);

  let detectedAnomalies = [];
  const monitoredActivity = await monitorFileActivity(userId);

  // Simulating AI-powered anomaly detection
  // @ai_updatable:start
const aiPrompt = `Analyze the following file activity for potential anomalies:
  - User ID: ${userId}
  - Storage providers: AWS S3, Google Drive, Dropbox
  - Activity Logs: ${JSON.stringify(monitoredActivity, null, 2)}

  Identify unusual access patterns, unauthorized actions, or abnormal deletion spikes. Respond in JSON format.`;
// @ai_updatable:end

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        model: "gpt-4",
        prompt: aiPrompt,
        max_tokens: 500,
        temperature: 0.3,
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );

    detectedAnomalies = JSON.parse(response.data.choices[0].text.trim());
  logAuditEntry({ action: 'AI operation', result: accessResponse, file: 'aiFileMonitor.mjs' });

    // AI Logs Learning: Store detected anomalies
    await aiLearningManager.logAILearning(userId, "file_anomalies_detected", { detectedAnomalies });

    return { detectedAnomalies };
  } catch (error) {
    console.error("❌ Error detecting file anomalies:", error.message);
    throw new Error("AI anomaly detection failed.");
  }
};

/**
 * Automatically optimizes file storage by detecting inefficiencies and suggesting improvements.
 * @param {string} userId - The user requesting optimization.
 * @returns {object} - AI-driven optimization results.
 */
const autoOptimizeStorage = async (userId) => {
  if (isKillSwitchEnabled()) return;
  console.log(`🛠️ AI optimizing file storage for user: ${userId}`);

  const storageEfficiency = await updateTotalStorage();
  let optimizationActions = [];

  // AI-generated optimization strategy
  const aiPrompt = `Optimize storage for the following user:
  - User ID: ${userId}
  - Storage efficiency: ${JSON.stringify(storageEfficiency, null, 2)}

  Suggest file migration, compression, deduplication, or archival strategies. Respond in JSON format.`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        model: "gpt-4",
        prompt: aiPrompt,
        max_tokens: 500,
        temperature: 0.3,
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );

    optimizationActions = JSON.parse(response.data.choices[0].text.trim());
  logAuditEntry({ action: 'AI operation', result: accessResponse, file: 'aiFileMonitor.mjs' });

    // AI Logs Learning: Store optimization recommendations
    await aiLearningManager.logAILearning(userId, "file_storage_optimization", { optimizationActions });

    return { optimizationActions };
  } catch (error) {
    console.error("❌ Error optimizing storage:", error.message);
    throw new Error("AI storage optimization failed.");
  }
};

export {
  monitorFileActivity,
  detectFileAnomalies,
  autoOptimizeStorage,
};
