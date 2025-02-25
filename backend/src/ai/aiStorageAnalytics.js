// File Path: /Users/patrick/Projects/Teralynk/backend/src/ai/aiStorageAnalytics.js

const { getAllStorageProviders, updateTotalStorage } = require("../config/dynamicStorageManager");
const aiLearningManager = require("./aiLearningManager");
const axios = require("axios");

/**
 * Analyzes storage usage and generates an AI-driven report.
 * @returns {object} - AI-generated storage analytics.
 */
const analyzeStorageUsage = async () => {
  console.log("📊 AI analyzing storage usage data...");

  await updateTotalStorage();
  const storageProviders = getAllStorageProviders();
  let storageReport = {};

  // AI-generated storage analytics report
  const aiPrompt = `Generate a detailed storage analytics report:
  - Storage Providers: ${JSON.stringify(storageProviders, null, 2)}

  Include total usage, bottlenecks, inefficiencies, and optimization recommendations.
  Respond in JSON format with keys: 'usage_summary', 'performance_issues', 'optimization_suggestions'.`;

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

    storageReport = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store storage analytics insights
    await aiLearningManager.logAILearning("platform", "storage_usage_analysis", { storageReport });

    console.log("✅ AI Storage Usage Report:", storageReport);
    return { storageReport };
  } catch (error) {
    console.error("❌ Error analyzing storage usage:", error.message);
    throw new Error("AI storage usage analysis failed.");
  }
};

/**
 * Predicts future storage trends based on usage patterns.
 * @returns {object} - AI-generated storage forecast.
 */
const predictStorageTrends = async () => {
  console.log("🔮 AI predicting future storage trends...");

  const usageReport = await analyzeStorageUsage();
  let storageForecast = {};

  // AI-generated storage trend prediction
  const aiPrompt = `Predict future storage trends based on usage data:
  - Current Storage Report: ${JSON.stringify(usageReport, null, 2)}

  Forecast demand for the next 6-12 months and recommend capacity planning.
  Respond in JSON format with keys: 'forecast_summary', 'expected_growth', 'expansion_recommendations'.`;

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

    storageForecast = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store storage forecast insights
    await aiLearningManager.logAILearning("platform", "storage_forecast", { storageForecast });

    console.log("📈 AI Storage Forecast:", storageForecast);
    return { storageForecast };
  } catch (error) {
    console.error("❌ Error predicting storage trends:", error.message);
    throw new Error("AI storage forecast failed.");
  }
};

/**
 * Generates AI-powered storage reports for users.
 * @param {string} userId - The user requesting the report.
 * @returns {object} - AI-generated user-specific storage report.
 */
const generateUserStorageReport = async (userId) => {
  console.log(`📃 AI generating personalized storage report for user: ${userId}`);

  const usageReport = await analyzeStorageUsage();
  const storageForecast = await predictStorageTrends();
  let userReport = {};

  // AI-generated personalized storage report
  const aiPrompt = `Generate a detailed storage report for user:
  - User ID: ${userId}
  - Usage Report: ${JSON.stringify(usageReport, null, 2)}
  - Forecast Data: ${JSON.stringify(storageForecast, null, 2)}

  Provide insights on past usage, current capacity, and future needs.
  Respond in JSON format with keys: 'report_summary', 'current_usage', 'future_recommendations'.`;

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

    userReport = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store user-specific storage report
    await aiLearningManager.logAILearning(userId, "user_storage_report", { userReport });

    console.log(`📋 AI Storage Report for User ${userId}:`, userReport);
    return { userReport };
  } catch (error) {
    console.error("❌ Error generating user storage report:", error.message);
    throw new Error("AI user storage report failed.");
  }
};

module.exports = {
  analyzeStorageUsage,
  predictStorageTrends,
  generateUserStorageReport,
};
