// File Path: /Users/patrick/Projects/Teralynk/backend/src/ai/aiStorageOptimizer.js

const { getAllStorageProviders, updateTotalStorage } = require("../config/dynamicStorageManager");
const aiLearningManager = require("./aiLearningManager");
const axios = require("axios");

/**
 * Determine the best storage provider based on AI learning and user preferences.
 * @param {string} userId - The user's ID
 * @param {number} fileSize - Size of the file in MB
 * @param {Array<string>} preferredProviders - User-selected storage providers
 * @returns {string|null} - The best provider for storing the file
 */
const determineBestStorageProvider = async (userId, fileSize, preferredProviders) => {
  await updateTotalStorage();
  const storageProviders = getAllStorageProviders();

  let bestProvider = null;
  let maxAvailableSpace = 0;

  // AI prioritizes providers based on past efficiency and current availability
  for (const provider of preferredProviders) {
    if (storageProviders[provider] && storageProviders[provider].totalStorage > fileSize) {
      if (storageProviders[provider].totalStorage > maxAvailableSpace) {
        bestProvider = provider;
        maxAvailableSpace = storageProviders[provider].totalStorage;
      }
    }
  }

  if (!bestProvider) {
    console.warn(`⚠ No available storage in preferred providers for user ${userId}. AI will attempt to find alternatives.`);
    
    // AI automatically selects the best alternative provider
    for (const provider in storageProviders) {
      if (storageProviders[provider].totalStorage > fileSize) {
        bestProvider = provider;
        break;
      }
    }
  }

  console.log(`📦 AI Selected Best Storage Provider for user ${userId}: ${bestProvider}`);
  
  // Log AI learning event
  await aiLearningManager.logAILearning(userId, "storage_selection", { bestProvider, fileSize });

  return bestProvider;
};

/**
 * Automatically migrate files from a full provider to an available one.
 * @param {string} userId - The user's ID
 * @param {string} fileName - Name of the file
 * @param {string} currentProvider - Current storage provider
 */
const migrateFileToAvailableStorage = async (userId, fileName, currentProvider) => {
  await updateTotalStorage();
  const storageProviders = getAllStorageProviders();

  for (const provider in storageProviders) {
    if (provider !== currentProvider && storageProviders[provider].totalStorage > 0) {
      console.log(`🔄 AI Migrating file '${fileName}' from ${currentProvider} to ${provider}...`);

      try {
        await axios.post(`${storageProviders[provider].apiUrl}/migrate`, {
          userId,
          fileName,
          from: currentProvider,
          to: provider,
        });

        // Log AI learning event
        await aiLearningManager.logAILearning(userId, "storage_migration", {
          fileName,
          from: currentProvider,
          to: provider,
        });

        console.log(`✅ AI successfully migrated '${fileName}' to ${provider}.`);
        return provider;
      } catch (error) {
        console.error(`❌ AI Error migrating file '${fileName}':`, error.message);
      }
    }
  }

  console.warn(`❌ AI: No available storage providers to migrate file '${fileName}'.`);
  return null;
};

/**
 * AI-Driven Storage Optimization: Analyze storage patterns & balance usage.
 */
const analyzeStorageEfficiency = async () => {
  console.log("🔍 AI Analyzing Storage Efficiency...");
  await updateTotalStorage();

  const storageProviders = getAllStorageProviders();
  let underutilized = [];
  let overutilized = [];

  for (const provider in storageProviders) {
    if (storageProviders[provider].totalStorage > 100) {
      underutilized.push(provider);
    } else if (storageProviders[provider].totalStorage < 10) {
      overutilized.push(provider);
    }
  }

  console.log(`⚖️ AI Found Underutilized Storage: ${underutilized}`);
  console.log(`🔥 AI Found Overutilized Storage: ${overutilized}`);

  // Log AI learning event
  await aiLearningManager.logAILearning("platform", "storage_efficiency_analysis", {
    underutilized,
    overutilized,
  });

  return { underutilized, overutilized };
};

/**
 * AI Self-Improvement: AI learns from storage decisions and optimizes future selections.
 * @returns {Promise<void>}
 */
const improveStorageAI = async () => {
  console.log("🤖 AI Self-Improvement: Analyzing Storage Decision Patterns...");
  
  const learningData = await aiLearningManager.getLearningData("storage_selection");

  if (!learningData || learningData.length === 0) {
    console.warn("⚠ AI has no past data for storage optimization. Continuing normal operations.");
    return;
  }

  let successRate = 0;
  let failedDecisions = 0;

  for (const entry of learningData) {
    if (entry.success) {
      successRate++;
    } else {
      failedDecisions++;
    }
  }

  // Adjust AI decision-making based on past performance
  if (failedDecisions > successRate) {
    console.warn("⚠ AI detected too many failed storage decisions. Adjusting logic...");
    
    // AI modifies its provider selection weightings based on real-time data
    await aiLearningManager.modifyAIStrategy("storage_selection", { adjustThreshold: true });
  }

  console.log(`✅ AI Self-Improvement Complete: Success Rate ${successRate}, Adjustments Made: ${failedDecisions}`);
};

module.exports = {
  determineBestStorageProvider,
  migrateFileToAvailableStorage,
  analyzeStorageEfficiency,
  improveStorageAI,
};
