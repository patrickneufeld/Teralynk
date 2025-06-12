import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// File Path: /Users/patrick/Projects/Teralynk/backend/src/ai/aiStorageManager.js

const { getStorageClient, listAvailableStorageProviders, addNewStorageProvider } = await import("../config/storageConfig.js");
import aiLearningManager from "./aiLearningManager.mjs";
import axios from "axios";

/**
 * Allow users to select a preferred storage provider.
 * @param {string} userId - The user selecting storage.
 * @param {string} provider - The selected storage provider.
 */
const selectStorageProvider = async (userId, provider) => {
  if (isKillSwitchEnabled()) return;
  const availableProviders = listAvailableStorageProviders();

  if (!availableProviders.includes(provider)) {
    throw new Error(`❌ Invalid storage provider: ${provider}`);
  }

  // AI logs storage selection event
  await aiLearningManager.logAILearning(userId, "storage_selection", { provider });

  return { message: `Storage provider '${provider}' selected successfully.` };
};

/**
 * Automatically expands storage by migrating files to an available provider when one is full.
 * @param {string} userId - The user running out of storage.
 * @param {string} fileName - The file needing migration.
 */
const autoExpandStorage = async (userId, fileName) => {
  if (isKillSwitchEnabled()) return;
  const availableProviders = listAvailableStorageProviders();

  for (const provider of availableProviders) {
    try {
      const storageClient = getStorageClient(provider);

      // Check if the provider has sufficient storage (Mocked AI request)
      const response = await axios.post(
        "https://api.openai.com/v1/completions",
        {
          model: "gpt-4",
          prompt: `Check if the storage provider '${provider}' has enough space for the file '${fileName}'. Respond with 'YES' or 'NO'.`,
          max_tokens: 10,
          temperature: 0.2,
        },
        {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        }
      );

      if (response.data.choices[0].text.trim() === "YES") {
        // AI logs storage migration event
        await aiLearningManager.logAILearning(userId, "storage_migrated", { provider, fileName });

        return { message: `File '${fileName}' moved to '${provider}' due to low storage.` };
      }
    } catch (error) {
      console.warn(`⚠️ Unable to check storage for provider '${provider}': ${error.message}`);
    }
  }

  throw new Error("❌ No available storage providers with sufficient space.");
};

/**
 * Adds a new storage provider and makes it available for all users.
 * @param {string} userId - The user adding a new provider.
 * @param {string} providerName - The name of the new storage provider.
 * @param {object} config - Configuration details for the new provider.
 */
const addNewProvider = async (userId, providerName, config) => {
  if (isKillSwitchEnabled()) return;
  if (!providerName || !config) {
    throw new Error("❌ Provider name and configuration are required.");
  }

  addNewStorageProvider(providerName, config);

  // AI logs new provider addition
  await aiLearningManager.logAILearning(userId, "new_storage_added", { providerName, config });

  return { message: `Storage provider '${providerName}' added successfully and is now available.` };
};

export {
  selectStorageProvider,
  autoExpandStorage,
  addNewProvider,
};
