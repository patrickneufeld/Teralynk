// File Path: /Users/patrick/Projects/Teralynk/backend/src/config/dynamicStorageManager.js

import dotenv from 'dotenv';
import axios from 'axios';
import { listAvailableStorageProviders } from './dynamicStorageConfig.js'; // Adjusted import for ES modules
import { logAILearning } from "../ai/aiLearningManager.js"; // Corrected named import for aiLearningManager

dotenv.config();

const dynamicStorageProviders = {}; // Stores user-added storage providers

/**
 * ✅ Register a new storage provider dynamically
 * @param {string} providerName - Name of the storage provider
 * @param {string} apiUrl - API URL for storage operations
 * @param {object} credentials - Required credentials (if any)
 */
const registerStorageProvider = async (providerName, apiUrl, credentials = {}) => {
  if (dynamicStorageProviders[providerName]) {
    console.log(`✅ Storage provider '${providerName}' is already registered.`);
    return dynamicStorageProviders[providerName];
  }

  try {
    // ✅ Verify API connection
    const testResponse = await axios.get(`${apiUrl}/status`, {
      headers: { Authorization: `Bearer ${credentials.apiKey || ""}` },
    });

    if (testResponse.status !== 200) {
      throw new Error(`Failed to verify '${providerName}' API`);
    }

    // ✅ Register provider
    dynamicStorageProviders[providerName] = {
      apiUrl,
      credentials,
      totalStorage: 0, // Updated dynamically
    };

    console.log(`🚀 New storage provider added: ${providerName}`);

    // ✅ Log AI learning from new storage addition
    await logAILearning("platform", "storage_provider_added", {
      providerName,
      apiUrl,
    });

    return dynamicStorageProviders[providerName];
  } catch (error) {
    console.error(`❌ Failed to register storage provider '${providerName}':`, error.message);
    throw error;
  }
};

/**
 * ✅ Retrieve all active storage providers (built-in + user-added)
 */
const getAllStorageProviders = () => {
  const builtInProviders = listAvailableStorageProviders().reduce((acc, providerName) => {
    acc[providerName] = getStorageClient(providerName);
    return acc;
  }, {});
  return {
    ...builtInProviders, // ✅ Built-in providers
    ...dynamicStorageProviders, // ✅ User-added providers
  };
};

/**
 * ✅ Allow users to select preferred storage providers
 * @param {string} userId - The user's ID
 * @param {Array<string>} selectedProviders - List of provider names
 */
const setUserStoragePreferences = async (userId, selectedProviders) => {
  try {
    const availableProviders = getAllStorageProviders();

    // ✅ Validate providers
    const validProviders = selectedProviders.filter((provider) =>
      Object.hasOwn(availableProviders, provider)
    );

    if (validProviders.length === 0) {
      throw new Error("❌ No valid storage providers selected.");
    }

    // ✅ Log the selection in AI learning manager
    await logAILearning(userId, "storage_selection", { selectedProviders });

    console.log(`✅ User '${userId}' selected storage providers:`, validProviders);
    return validProviders;
  } catch (error) {
    console.error(`❌ Error setting storage preferences:`, error.message);
    throw error;
  }
};

/**
 * ✅ Update total available storage based on connected providers
 */
const updateTotalStorage = async () => {
  const providers = getAllStorageProviders();
  let totalStorage = 0;

  for (const provider in providers) {
    if (!providers[provider].apiUrl) {
      console.warn(`⚠ Warning: Provider '${provider}' has no API URL. Skipping.`);
      continue;
    }

    try {
      const response = await axios.get(`${providers[provider].apiUrl}/storage-info`, {
        headers: { Authorization: `Bearer ${providers[provider].credentials.apiKey || ""}` },
      });

      if (response.data.totalStorage) {
        providers[provider].totalStorage = response.data.totalStorage;
        totalStorage += response.data.totalStorage;
      }
    } catch (error) {
      console.warn(`⚠ Warning: Could not retrieve storage info for '${provider}':`, error.message);
    }
  }

  console.log(`📊 Updated total available storage: ${totalStorage} GB`);
  return totalStorage;
};
/**
 * ✅ Remove a storage provider
 * @param {string} providerName - Storage provider to remove
 */
const removeStorageProvider = async (providerName) => {
  if (!dynamicStorageProviders[providerName]) {
    throw new Error(`❌ Storage provider '${providerName}' is not registered.`);
  }

  delete dynamicStorageProviders[providerName];

  console.log(`🗑️ Storage provider '${providerName}' removed successfully.`);
  await logAILearning("platform", "storage_provider_removed", { providerName });

  return { message: `✅ Storage provider '${providerName}' removed successfully.` };
};

/**
 * ✅ Get the storage client for a given provider.
 * @param {string} provider - The storage provider name.
 */
const getStorageClient = (provider) => {
  if (!dynamicStorageProviders[provider]) {
    throw new Error(`❌ Invalid storage provider: ${provider}`);
  }
  return dynamicStorageProviders[provider];
};

// Export functions to make them available to other modules
export {
  registerStorageProvider,
  getAllStorageProviders,
  setUserStoragePreferences,
  updateTotalStorage,
  removeStorageProvider,
  getStorageClient, // Ensure `getStorageClient` is exported
};
