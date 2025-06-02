// File Path: /Users/patrick/Projects/Teralynk/backend/src/ai/aiStorageBalancer.js

const { getAllStorageProviders, updateTotalStorage } = await import("../config/dynamicStorageManager.js");
import aiLearningManager from "./aiLearningManager.mjs";
import axios from "axios";

/**
 * Distributes storage load across multiple providers to maximize efficiency.
 * @param {string} userId - The user requesting storage balancing.
 * @returns {object} - AI-driven storage balancing plan.
 */
const balanceStorageLoad = async (userId) => {
  console.log(`⚖️ AI balancing storage load for user: ${userId}`);

  await updateTotalStorage();
  const storageProviders = getAllStorageProviders();
  let balancingPlan = [];

  // AI-generated storage distribution strategy
  const aiPrompt = `Balance storage load for user:
  - User ID: ${userId}
  - Available Storage: ${JSON.stringify(storageProviders, null, 2)}

  Suggest optimal file distribution across storage services. Respond in JSON format.`;

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

    balancingPlan = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store storage balancing insights
    await aiLearningManager.logAILearning(userId, "storage_balancing", { balancingPlan });

    return { balancingPlan };
  } catch (error) {
    console.error("❌ Error balancing storage load:", error.message);
    throw new Error("AI storage balancing failed.");
  }
};

/**
 * Predicts future storage needs based on usage trends and recommends expansions.
 * @param {string} userId - The user whose storage needs are predicted.
 * @returns {object} - AI-driven storage prediction.
 */
const predictStorageNeeds = async (userId) => {
  console.log(`📊 AI predicting future storage needs for user: ${userId}`);

  await updateTotalStorage();
  const storageProviders = getAllStorageProviders();
  let storagePrediction = [];

  // AI-generated prediction strategy
  const aiPrompt = `Predict storage needs for user:
  - User ID: ${userId}
  - Current Storage Usage: ${JSON.stringify(storageProviders, null, 2)}

  Forecast storage needs for the next 6 months and recommend provider expansions if necessary. Respond in JSON format.`;

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

    storagePrediction = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store storage prediction insights
    await aiLearningManager.logAILearning(userId, "storage_prediction", { storagePrediction });

    return { storagePrediction };
  } catch (error) {
    console.error("❌ Error predicting storage needs:", error.message);
    throw new Error("AI storage prediction failed.");
  }
};

/**
 * Recommends user actions for optimizing storage management.
 * @param {string} userId - The user receiving recommendations.
 * @returns {object} - AI-driven recommendations.
 */
const recommendStorageActions = async (userId) => {
  console.log(`🔍 AI generating storage recommendations for user: ${userId}`);

  const storageBalancing = await balanceStorageLoad(userId);
  const storageForecast = await predictStorageNeeds(userId);
  let recommendations = [];

  // AI-generated recommendations
  const aiPrompt = `Provide storage recommendations for user:
  - User ID: ${userId}
  - Storage Balancing Plan: ${JSON.stringify(storageBalancing, null, 2)}
  - Predicted Storage Needs: ${JSON.stringify(storageForecast, null, 2)}

  Suggest actions such as storage consolidation, migration, or new provider integration. Respond in JSON format.`;

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

    recommendations = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store recommendations
    await aiLearningManager.logAILearning(userId, "storage_recommendations", { recommendations });

    return { recommendations };
  } catch (error) {
    console.error("❌ Error generating storage recommendations:", error.message);
    throw new Error("AI storage recommendation failed.");
  }
};

export {
  balanceStorageLoad,
  predictStorageNeeds,
  recommendStorageActions,
};
