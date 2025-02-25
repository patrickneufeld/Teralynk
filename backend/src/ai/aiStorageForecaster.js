// File Path: /Users/patrick/Projects/Teralynk/backend/src/ai/aiStorageForecaster.js

const { getAllStorageProviders, updateTotalStorage } = require("../config/dynamicStorageManager");
const aiLearningManager = require("./aiLearningManager");
const axios = require("axios");

/**
 * Predicts future storage usage trends based on historical data.
 * AI analyzes past user behavior and recommends expansion/reduction strategies.
 * @param {string} userId - The user whose storage trends are being analyzed.
 * @returns {object} - AI-driven storage forecast.
 */
const forecastStorageTrends = async (userId) => {
  console.log(`📊 AI forecasting future storage trends for user: ${userId}`);

  await updateTotalStorage();
  const storageProviders = getAllStorageProviders();
  let storageForecast = {};

  // AI-generated forecasting strategy
  const aiPrompt = `Analyze storage trends for user:
  - User ID: ${userId}
  - Storage Usage History: ${JSON.stringify(storageProviders, null, 2)}

  Predict storage needs for the next 6-12 months. Provide recommendations for expansion, reduction, or provider changes.
  Respond in JSON format with keys: 'future_storage_needs', 'growth_trend', 'recommended_providers'.`;

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

    // AI Logs Learning: Store storage forecasting insights
    await aiLearningManager.logAILearning(userId, "storage_forecast", { storageForecast });

    console.log(`📈 AI Storage Forecast for User ${userId}:`, storageForecast);
    return { storageForecast };
  } catch (error) {
    console.error("❌ Error predicting storage trends:", error.message);
    throw new Error("AI storage forecasting failed.");
  }
};

/**
 * AI suggests storage provider expansions based on predicted growth.
 * @param {string} userId - The user needing future storage planning.
 * @returns {object} - AI-driven storage expansion recommendations.
 */
const recommendStorageExpansion = async (userId) => {
  console.log(`🚀 AI recommending storage expansion for user: ${userId}`);

  const storageForecast = await forecastStorageTrends(userId);
  let expansionRecommendations = {};

  // AI-generated recommendation strategy
  const aiPrompt = `Based on predicted storage trends:
  - User ID: ${userId}
  - Forecast Data: ${JSON.stringify(storageForecast, null, 2)}

  Recommend provider expansions, storage migrations, or new integrations.
  Respond in JSON format with keys: 'recommended_expansions', 'migration_suggestions', 'provider_changes'.`;

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

    expansionRecommendations = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store expansion insights
    await aiLearningManager.logAILearning(userId, "storage_expansion_recommendations", { expansionRecommendations });

    console.log(`📊 AI Storage Expansion Plan for User ${userId}:`, expansionRecommendations);
    return { expansionRecommendations };
  } catch (error) {
    console.error("❌ Error recommending storage expansion:", error.message);
    throw new Error("AI storage expansion recommendation failed.");
  }
};

/**
 * AI suggests reducing unnecessary storage to optimize costs.
 * @param {string} userId - The user needing cost optimization.
 * @returns {object} - AI-driven storage reduction recommendations.
 */
const suggestStorageReduction = async (userId) => {
  console.log(`📉 AI recommending storage reduction for user: ${userId}`);

  const storageForecast = await forecastStorageTrends(userId);
  let reductionPlan = {};

  // AI-generated cost-saving strategy
  const aiPrompt = `Analyze storage optimization needs:
  - User ID: ${userId}
  - Storage Forecast Data: ${JSON.stringify(storageForecast, null, 2)}

  Recommend actions to reduce excess storage, minimize costs, or downgrade providers.
  Respond in JSON format with keys: 'reduction_plan', 'cost_saving_measures', 'provider_downgrades'.`;

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

    reductionPlan = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store storage reduction insights
    await aiLearningManager.logAILearning(userId, "storage_reduction_recommendations", { reductionPlan });

    console.log(`📊 AI Storage Reduction Plan for User ${userId}:`, reductionPlan);
    return { reductionPlan };
  } catch (error) {
    console.error("❌ Error suggesting storage reduction:", error.message);
    throw new Error("AI storage reduction failed.");
  }
};

/**
 * Runs a full AI-driven storage forecasting cycle.
 * Predicts trends, suggests expansions, and recommends optimizations.
 * @param {string} userId - The user needing a full storage forecast.
 * @returns {object} - AI-driven storage planning report.
 */
const runStorageForecasting = async (userId) => {
  console.log(`🔄 Running full AI storage forecasting cycle for user: ${userId}`);

  const forecast = await forecastStorageTrends(userId);
  const expansion = await recommendStorageExpansion(userId);
  const reduction = await suggestStorageReduction(userId);

  const forecastingReport = {
    forecast,
    expansion,
    reduction,
  };

  // AI Logs Learning: Store full forecasting cycle insights
  await aiLearningManager.logAILearning(userId, "storage_forecasting_cycle", { forecastingReport });

  return forecastingReport;
};

module.exports = {
  forecastStorageTrends,
  recommendStorageExpansion,
  suggestStorageReduction,
  runStorageForecasting,
};
