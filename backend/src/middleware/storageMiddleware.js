// File Path: /Users/patrick/Projects/Teralynk/backend/src/middleware/storageMiddleware.js

const { getAllStorageProviders } = require("../config/dynamicStorageManager");
import aiLearningManager from "../ai/aiLearningManager";

/**
 * Middleware to validate if a selected storage provider is available and allowed
 * @param {string} provider - Name of the storage provider
 */
const validateStorageProvider = (req, res, next) => {
  const { provider } = req.body || req.query;

  if (!provider) {
    return res.status(400).json({ error: "❌ Storage provider is required." });
  }

  const availableProviders = getAllStorageProviders();

  if (!availableProviders[provider]) {
    return res.status(400).json({ error: `❌ Storage provider '${provider}' is not registered.` });
  }

  console.log(`✅ Storage provider '${provider}' validated.`);
  req.storageProvider = provider;
  next();
};

/**
 * Middleware to ensure a user has access to a specific storage provider
 */
const checkUserStorageAccess = async (req, res, next) => {
  const { userId } = req.user;
  const { provider } = req.body || req.query;

  if (!provider) {
    return res.status(400).json({ error: "❌ Storage provider is required." });
  }

  try {
    const availableProviders = getAllStorageProviders();
    
    if (!availableProviders[provider]) {
      return res.status(400).json({ error: `❌ Storage provider '${provider}' is not available.` });
    }

    console.log(`🔐 Checking storage access for user: ${userId} on '${provider}'`);

    // AI logs access validation
    await aiLearningManager.logAILearning(userId, "storage_access_validated", { provider });

    req.storageProvider = provider;
    next();
  } catch (error) {
    console.error(`❌ Error checking storage access:`, error.message);
    return res.status(500).json({ error: "Internal storage validation error." });
  }
};

module.exports = {
  validateStorageProvider,
  checkUserStorageAccess,
};
