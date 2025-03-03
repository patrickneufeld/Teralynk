import { logAILearning } from './aiLearningManager.js';  // Correctly import the logAILearning function
import axios from 'axios';  // For making API calls
import { getStorageClient } from '../config/storageConfig.js';  // Correct import to get storage clients

// Function to determine the best storage provider for a given user and file
const determineBestStorageProvider = async (userId, fileSize, preferredProviders) => {
  const storageProviders = getStorageClient(); // Fetch storage providers
  
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
  await logAILearning(userId, "storage_selection", { bestProvider, fileSize });

  return bestProvider;
};

// Function to automatically migrate files to a more available storage provider
const migrateFileToAvailableStorage = async (userId, fileName, currentProvider) => {
  const storageProviders = getStorageClient();
  
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
        await logAILearning(userId, "storage_migration", { fileName, from: currentProvider, to: provider });

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

// Function to analyze the efficiency of the storage and identify over/underutilized providers
const analyzeStorageEfficiency = async () => {
  console.log("🔍 AI Analyzing Storage Efficiency...");
  
  const storageProviders = getStorageClient();
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
  await logAILearning("platform", "storage_efficiency_analysis", { underutilized, overutilized });

  return { underutilized, overutilized };
};

// Function to improve storage selection AI based on its past decisions
const improveStorageAI = async () => {  // Ensure only one definition and export
  console.log("🤖 AI Self-Improvement: Analyzing Storage Decision Patterns...");
  
  const learningData = await getLearningData("storage_selection");

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
    await modifyAIStrategy("storage_selection", { adjustThreshold: true });
  }

  console.log(`✅ AI Self-Improvement Complete: Success Rate ${successRate}, Adjustments Made: ${failedDecisions}`);
};

// Helper function to get learning data for specific action types (e.g., storage decisions)
const getLearningData = async (actionType) => {
  try {
    // Assuming you have a function in the database module to fetch learning data
    const learningData = await db.getLearningData(actionType);
    return learningData;
  } catch (error) {
    console.error("❌ Error fetching learning data:", error.message);
    return [];
  }
};

// Helper function to modify AI strategy based on learning data
const modifyAIStrategy = async (actionType, adjustments) => {
  try {
    console.log(`⚙️ Modifying AI strategy for ${actionType}...`);

    let currentStrategy = await db.getAIStrategy(actionType);

    if (!currentStrategy) {
      console.warn("⚠️ No current strategy found, creating new strategy.");
      currentStrategy = {};
    }

    // Apply adjustments to strategy
    currentStrategy = { ...currentStrategy, ...adjustments };
    
    // Save the new strategy to the database
    await db.saveAIStrategy(actionType, currentStrategy);
    console.log(`✅ AI strategy for ${actionType} updated.`);
  } catch (error) {
    console.error(`❌ Error modifying AI strategy for ${actionType}:`, error.message);
  }
};

// Export all functions to be used in other files
export { 
  determineBestStorageProvider, 
  migrateFileToAvailableStorage, 
  analyzeStorageEfficiency, 
  improveStorageAI 
};
