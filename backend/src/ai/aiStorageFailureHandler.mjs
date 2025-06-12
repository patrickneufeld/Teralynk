import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// File Path: /Users/patrick/Projects/Teralynk/backend/src/ai/aiStorageFailureHandler.js

const { getAllStorageProviders, updateTotalStorage } = await import("../config/dynamicStorageManager.js");
import aiLearningManager from "./aiLearningManager.mjs";
import axios from "axios";

/**
 * Detects storage failures and retries failed operations.
 * @param {string} userId - The user experiencing the failure.
 * @param {string} provider - The storage provider that failed.
 * @param {string} fileName - The file involved in the failure.
 * @returns {object} - AI-driven failure handling result.
 */
const handleStorageFailure = async (userId, provider, fileName) => {
  if (isKillSwitchEnabled()) return;
  console.error(`❌ Storage failure detected for provider: ${provider}, file: ${fileName}`);

  await updateTotalStorage();
  const storageProviders = getAllStorageProviders();
  let retryResult = {};

  // AI-generated failure recovery strategy
  // @ai_updatable:start
const aiPrompt = `Analyze storage failure:
  - User ID: ${userId}
  - Failed Provider: ${provider}
  - File Name: ${fileName}
  - Available Storage: ${JSON.stringify(storageProviders, null, 2)}

  Suggest retry strategy or alternative provider in JSON format.`;
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

    retryResult = JSON.parse(response.data.choices[0].text.trim());
  logAuditEntry({ action: 'AI operation', result: accessResponse, file: 'aiStorageFailureHandler.mjs' });

    // AI Logs Learning: Store failure handling insights
    await aiLearningManager.logAILearning(userId, "storage_failure_handling", { retryResult });

    console.log(`✅ AI Failure Handling Plan for User ${userId}:`, retryResult);
    return { retryResult };
  } catch (error) {
    console.error("❌ Error generating failure handling plan:", error.message);
    throw new Error("AI storage failure handling failed.");
  }
};

/**
 * Switches to an alternative storage provider if failure persists.
 * @param {string} userId - The user affected by the failure.
 * @param {string} failedProvider - The provider that failed.
 * @param {string} fileName - The affected file.
 * @returns {object} - AI-driven provider switching strategy.
 */
const switchStorageProvider = async (userId, failedProvider, fileName) => {
  if (isKillSwitchEnabled()) return;
  console.warn(`⚠️ AI attempting to switch providers due to failure on ${failedProvider}`);

  const retryResult = await handleStorageFailure(userId, failedProvider, fileName);
  let switchResult = {};

  if (!retryResult || retryResult.action !== "switch_provider") {
    console.log(`✅ No provider switch needed for user: ${userId}`);
    return { message: "Provider switch not required." };
  }

  const newProvider = retryResult.recommendedProvider;

  if (!newProvider) {
    console.warn(`⚠️ No recommended provider for switching. AI needs more data.`);
    return { message: "AI couldn"t determine the best switch option." };
  }

  try {
    console.log(`🔄 Switching storage for user ${userId} from ${failedProvider} to ${newProvider}`);

    // Call API to move the file
    await axios.post(`${getAllStorageProviders()[newProvider].apiUrl}/migrate`, {
      userId,
      fileName,
      from: failedProvider,
      to: newProvider,
    });

    switchResult = { message: `Storage switched to provider ${newProvider}.` };

    // AI Logs Learning: Store provider switch insights
    await aiLearningManager.logAILearning(userId, "storage_provider_switch", { switchResult });

    return switchResult;
  } catch (error) {
    console.error("❌ Error switching providers:", error.message);
    throw new Error("AI storage provider switch failed.");
  }
};

/**
 * Runs a full storage failure management cycle.
 * @param {string} userId - The user experiencing storage issues.
 * @param {string} provider - The failing storage provider.
 * @param {string} fileName - The affected file.
 * @returns {object} - AI-driven failure resolution plan.
 */
const manageStorageFailures = async (userId, provider, fileName) => {
  if (isKillSwitchEnabled()) return;
  console.log(`🔄 AI running full storage failure resolution cycle for user: ${userId}`);

  const retryResult = await handleStorageFailure(userId, provider, fileName);
  const switchResult = await switchStorageProvider(userId, provider, fileName);

  const resolutionPlan = {
    retry: retryResult,
    switch: switchResult,
  };

  // AI Logs Learning: Store failure resolution cycle insights
  await aiLearningManager.logAILearning(userId, "storage_failure_resolution", { resolutionPlan });

  return resolutionPlan;
};

export {
  handleStorageFailure,
  switchStorageProvider,
  manageStorageFailures,
};
