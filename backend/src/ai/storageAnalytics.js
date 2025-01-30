// File Path: /Users/patrick/Projects/Teralynk/backend/src/ai/storageAnalytics.js

const { getAllStorageProviders, updateTotalStorage } = require("../config/dynamicStorageManager");
const aiLearningManager = require("./aiLearningManager");
const axios = require("axios");

/**
 * Analyzes user storage patterns and identifies optimization opportunities.
 * @param {string} userId - The user whose storage is being analyzed.
 * @returns {object} - AI-driven analysis of storage usage.
 */
const analyzeStorageUsage = async (userId) => {
  console.log(`📊 AI analyzing storage usage for user: ${userId}`);

  await updateTotalStorage();
  const storageProviders = getAllStorageProviders();
  let storageAnalysis = {};

  // AI-generated storage analysis
  const aiPrompt = `Analyze storage usage for user:
  - User ID: ${userId}
  - Storage Data: ${JSON.stringify(storageProviders, null, 2)}

  Identify high-usage patterns, suggest optimizations, and detect redundant storage consumption. Respond in JSON format.`;

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

    storageAnalysis = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store storage insights
    await aiLearningManager.logAILearning(userId, "storage_usage_analysis", { storageAnalysis });

    return { storageAnalysis };
  } catch (error) {
    console.error("❌ Error analyzing storage usage:", error.message);
    throw new Error("AI storage analysis failed.");
  }
};

/**
 * Detects and recommends actions for reducing redundant storage.
 * @param {string} userId - The user whose redundant files are being analyzed.
 * @returns {object} - AI-driven recommendations for storage optimization.
 */
const detectRedundantStorage = async (userId) => {
  console.log(`🔍 AI detecting redundant storage for user: ${userId}`);

  const storageAnalysis = await analyzeStorageUsage(userId);
  let redundancyReport = {};

  // AI-generated redundancy detection
  const aiPrompt = `Detect redundant storage usage for user:
  - User ID: ${userId}
  - Storage Analysis: ${JSON.stringify(storageAnalysis, null, 2)}

  Identify duplicate files, unused storage, and suggest actions to optimize space. Respond in JSON format.`;

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

    redundancyReport = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store redundancy insights
    await aiLearningManager.logAILearning(userId, "storage_redundancy_detection", { redundancyReport });

    return { redundancyReport };
  } catch (error) {
    console.error("❌ Error detecting redundant storage:", error.message);
    throw new Error("AI redundancy detection failed.");
  }
};

/**
 * Provides AI-driven storage optimization recommendations.
 * @param {string} userId - The user receiving recommendations.
 * @returns {object} - AI-driven storage optimization plan.
 */
const recommendStorageOptimizations = async (userId) => {
  console.log(`🛠️ AI generating storage optimization recommendations for user: ${userId}`);

  const redundancyReport = await detectRedundantStorage(userId);
  let optimizationRecommendations = {};

  // AI-generated optimization plan
  const aiPrompt = `Provide storage optimization recommendations for user:
  - User ID: ${userId}
  - Redundancy Report: ${JSON.stringify(redundancyReport, null, 2)}

  Suggest ways to consolidate storage, delete unnecessary files, and balance usage across providers. Respond in JSON format.`;

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

    optimizationRecommendations = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store optimization insights
    await aiLearningManager.logAILearning(userId, "storage_optimization_recommendations", {
      optimizationRecommendations,
    });

    return { optimizationRecommendations };
  } catch (error) {
    console.error("❌ Error generating storage optimization recommendations:", error.message);
    throw new Error("AI storage optimization failed.");
  }
};

module.exports = {
  analyzeStorageUsage,
  detectRedundantStorage,
  recommendStorageOptimizations,
};
