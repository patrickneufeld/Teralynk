// ✅ FILE: /backend/src/config/dynamicStorageManager.mjs

import dotenv from 'dotenv';
import axios from 'axios';
import { listAvailableStorageProviders } from './dynamicStorageConfig.mjs';
import { logAILearning } from '../ai/aiLearningManager.mjs';
import { getStorageClient as builtInStorageClient } from './storageConfig.mjs';
import { logInfo, logError } from '../utils/logger.mjs';

dotenv.config();

const dynamicStorageProviders = {};

/**
 * ✅ Register a new storage provider dynamically
 */
export const registerStorageProvider = async (providerName, apiUrl, credentials = {}) => {
  if (dynamicStorageProviders[providerName]) {
    logInfo(`Storage provider '${providerName}' already registered.`);
    return dynamicStorageProviders[providerName];
  }

  try {
    const testResponse = await axios.get(`${apiUrl}/status`, {
      headers: { Authorization: `Bearer ${credentials.apiKey || ''}` },
    });

    if (testResponse.status !== 200) {
      throw new Error(`Failed to verify '${providerName}' API`);
    }

    dynamicStorageProviders[providerName] = {
      apiUrl,
      credentials,
      totalStorage: 0,
    };

    logInfo(`🚀 New storage provider registered: ${providerName}`);
    await logAILearning('platform', 'storage_provider_added', { providerName, apiUrl });

    return dynamicStorageProviders[providerName];
  } catch (error) {
    logError(`❌ Registration failed for '${providerName}'`, { error });
    throw error;
  }
};

/**
 * ✅ Retrieve all active storage providers (built-in + user-added)
 */
export const getAllStorageProviders = () => {
  const builtIns = listAvailableStorageProviders().reduce((acc, name) => {
    try {
      acc[name] = builtInStorageClient(name);
    } catch (e) {
      logError(`❌ Failed to load built-in provider '${name}'`, { error: e });
    }
    return acc;
  }, {});
  return { ...builtIns, ...dynamicStorageProviders };
};

/**
 * ✅ Select preferred storage providers for a user
 */
export const setUserStoragePreferences = async (userId, selectedProviders) => {
  try {
    const available = getAllStorageProviders();
    const valid = selectedProviders.filter((p) => Object.hasOwn(available, p));

    if (!valid.length) {
      throw new Error('No valid storage providers selected.');
    }

    await logAILearning(userId, 'storage_selection', { selectedProviders: valid });
    logInfo(`User '${userId}' selected providers: ${valid}`);
    return valid;
  } catch (error) {
    logError('Error setting storage preferences', { error });
    throw error;
  }
};

/**
 * ✅ Update total available storage across all providers
 */
export const updateTotalStorage = async () => {
  const providers = getAllStorageProviders();
  let total = 0;

  for (const provider in providers) {
    const { apiUrl, credentials } = providers[provider];
    if (!apiUrl) continue;

    try {
      const res = await axios.get(`${apiUrl}/storage-info`, {
        headers: { Authorization: `Bearer ${credentials.apiKey || ''}` },
      });

      const size = parseFloat(res.data.totalStorage || 0);
      providers[provider].totalStorage = size;
      total += size;
    } catch (error) {
      logError(`Could not fetch storage info for '${provider}'`, { error });
    }
  }

  logInfo('📊 Total available storage updated', { total });
  return total;
};

/**
 * ✅ Remove a user-added storage provider
 */
export const removeStorageProvider = async (providerName) => {
  if (!dynamicStorageProviders[providerName]) {
    throw new Error(`Storage provider '${providerName}' is not registered.`);
  }

  delete dynamicStorageProviders[providerName];
  logInfo(`🗑️ Provider '${providerName}' removed.`);
  await logAILearning('platform', 'storage_provider_removed', { providerName });

  return { message: `✅ '${providerName}' removed successfully.` };
};

/**
 * ✅ Get the storage client by provider name
 */
export const getStorageClient = (provider) => {
  if (dynamicStorageProviders[provider]) return dynamicStorageProviders[provider];
  return builtInStorageClient(provider); // fallback to built-in config
};

/**
 * ✅ Retrieve file content via provider API
 * @param {string} provider
 * @param {string} filePath
 * @returns {Promise<string>}
 */
export const getFileContent = async (provider, filePath) => {
  try {
    const client = getStorageClient(provider);
    const res = await axios.get(`${client.apiUrl}/read-file`, {
      params: { filePath },
      headers: { Authorization: `Bearer ${client.credentials.apiKey || ''}` },
    });

    if (res.status !== 200) {
      throw new Error(`Read failed for file: ${filePath}`);
    }

    logInfo(`📥 File content retrieved`, { provider, filePath });
    return res.data.content;
  } catch (error) {
    logError(`❌ Failed to get file content`, { provider, filePath, error });
    throw error;
  }
};
