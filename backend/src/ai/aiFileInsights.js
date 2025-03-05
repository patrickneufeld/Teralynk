// File Path: /Users/patrick/Projects/Teralynk/backend/src/ai/aiFileInsights.js

const { getAllStorageProviders, updateTotalStorage } = require("../config/dynamicStorageManager");
import aiLearningManager from "./aiLearningManager";
import axios from "axios";

/**
 * Analyze file usage patterns and recommend cleanup actions.
 * @param {string} userId - The user requesting file insights.
 * @returns {object} - AI-driven file analysis and recommendations.
 */
const analyzeFileUsage = async (userId) => {
  console.log(`📊 Analyzing file usage for user: ${userId}`);

  // Get all available storage providers
  const storageProviders = getAllStorageProviders();
  await updateTotalStorage();

  const insights = {};
  const cleanupRecommendations = [];

  for (const provider in storageProviders) {
    try {
      const response = await axios.get(`${storageProviders[provider].apiUrl}/file-usage`, {
        headers: { Authorization: `Bearer ${storageProviders[provider].credentials.apiKey || ""}` },
      });

      const { totalFiles, lastAccessed, unusedFiles } = response.data;
      insights[provider] = { totalFiles, lastAccessed };

      if (unusedFiles.length > 0) {
        cleanupRecommendations.push(...unusedFiles);
      }
    } catch (error) {
      console.warn(`⚠️ Unable to retrieve file usage for provider '${provider}': ${error.message}`);
    }
  }

  // AI Logs Learning: Improve over time
  await aiLearningManager.logAILearning(userId, "file_insights", { insights, cleanupRecommendations });

  return { insights, cleanupRecommendations };
};

/**
 * Suggest optimal file organization structure based on AI analysis.
 * @param {string} userId - The user requesting organization.
 * @returns {object} - AI-generated organization recommendations.
 */
const suggestFileOrganization = async (userId) => {
  console.log(`📁 AI generating file organization suggestions for user: ${userId}`);

  // Simulate AI recommendation using OpenAI
  const prompt = `Suggest an optimal folder structure for a user with the following storage insights:
  - User ID: ${userId}
  - Storage providers: AWS S3, Google Drive, Dropbox
  - Common files: Documents, Images, Videos, Large backups
  - Goal: Improve file accessibility and retrieval.
  
  Provide a structured response in JSON format.`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        model: "gpt-4",
        prompt,
        max_tokens: 500,
        temperature: 0.3,
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );

    const organizationPlan = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store organization improvements
    await aiLearningManager.logAILearning(userId, "file_organization_suggestion", { organizationPlan });

    return organizationPlan;
  } catch (error) {
    console.error("❌ Error generating AI organization suggestions:", error.message);
    throw new Error("Failed to generate AI organization recommendations.");
  }
};

/**
 * Detect outdated files and recommend archiving or deletion.
 * @param {string} userId - The user requesting cleanup.
 * @returns {object} - AI-driven recommendations for outdated files.
 */
const detectOutdatedFiles = async (userId) => {
  console.log(`🗂️ AI scanning outdated files for user: ${userId}`);

  const outdatedFiles = [];

  // Simulate scanning storage providers
  const storageProviders = getAllStorageProviders();
  for (const provider in storageProviders) {
    try {
      const response = await axios.get(`${storageProviders[provider].apiUrl}/outdated-files`, {
        headers: { Authorization: `Bearer ${storageProviders[provider].credentials.apiKey || ""}` },
      });

      if (response.data.outdatedFiles.length > 0) {
        outdatedFiles.push(...response.data.outdatedFiles);
      }
    } catch (error) {
      console.warn(`⚠️ Unable to check outdated files on provider '${provider}': ${error.message}`);
    }
  }

  // AI Logs Learning: Improve file recommendations
  await aiLearningManager.logAILearning(userId, "outdated_file_analysis", { outdatedFiles });

  return { outdatedFiles };
};

module.exports = {
  analyzeFileUsage,
  suggestFileOrganization,
  detectOutdatedFiles,
};
