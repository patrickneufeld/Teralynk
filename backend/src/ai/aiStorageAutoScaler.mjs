// File Path: /Users/patrick/Projects/Teralynk/backend/src/ai/aiStorageAutoScaler.js

const { getAllStorageProviders, updateTotalStorage, registerStorageProvider } = await import("../config/dynamicStorageManager.js");
import aiLearningManager from "./aiLearningManager.mjs";
import axios from "axios";

/**
 * Predicts future storage needs and scales accordingly.
 * @param {string} userId - The user whose storage is being scaled.
 * @returns {object} - AI-driven storage scaling plan.
 */
const scaleStorageAutomatically = async (userId) => {
  console.log(`📈 AI analyzing storage scaling needs for user: ${userId}`);

  await updateTotalStorage();
  const storageProviders = getAllStorageProviders();
  let scalingPlan = {};

  // AI-generated storage scaling strategy
  const aiPrompt = `Analyze storage trends and predict scaling needs for user:
  - User ID: ${userId}
  - Current Storage Data: ${JSON.stringify(storageProviders, null, 2)}

  Suggest whether to scale up or down storage based on current trends. Respond in JSON format.`;

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

    scalingPlan = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store scaling decisions
    await aiLearningManager.logAILearning(userId, "storage_scaling", { scalingPlan });

    console.log(`✅ AI Scaling Plan for User ${userId}:`, scalingPlan);
    return { scalingPlan };
  } catch (error) {
    console.error("❌ Error generating storage scaling plan:", error.message);
    throw new Error("AI storage scaling failed.");
  }
};

/**
 * Automatically adds more storage when nearing capacity.
 * @param {string} userId - The user requiring additional storage.
 * @returns {object} - AI-driven expansion strategy.
 */
const expandStorageAutomatically = async (userId) => {
  console.log(`🚀 AI checking for storage expansion needs for user: ${userId}`);

  const scalingPlan = await scaleStorageAutomatically(userId);
  let expansionResult = {};

  if (!scalingPlan || scalingPlan.action !== "scale_up") {
    console.log(`✅ No immediate storage expansion required for user: ${userId}`);
    return { message: "No expansion required." };
  }

  const recommendedProvider = scalingPlan.recommendedProvider;

  if (!recommendedProvider) {
    console.warn(`⚠️ No recommended provider for expansion. AI needs more data.`);
    return { message: "AI couldn"t determine the best expansion option." };
  }

  try {
    console.log(`🔄 Expanding storage for user ${userId} via provider: ${recommendedProvider}`);

    await registerStorageProvider(recommendedProvider, scalingPlan.providerDetails.apiUrl, scalingPlan.providerDetails.credentials);

    expansionResult = { message: `Storage expanded with provider ${recommendedProvider}.` };

    // AI Logs Learning: Store expansion insights
    await aiLearningManager.logAILearning(userId, "storage_expansion", { expansionResult });

    return expansionResult;
  } catch (error) {
    console.error("❌ Error expanding storage:", error.message);
    throw new Error("AI storage expansion failed.");
  }
};

/**
 * Reduces storage allocation if over-provisioned.
 * @param {string} userId - The user reducing excess storage.
 * @returns {object} - AI-driven storage reduction strategy.
 */
const reduceUnusedStorage = async (userId) => {
  console.log(`📉 AI checking for storage reduction needs for user: ${userId}`);

  const scalingPlan = await scaleStorageAutomatically(userId);
  let reductionResult = {};

  if (!scalingPlan || scalingPlan.action !== "scale_down") {
    console.log(`✅ No immediate storage reduction required for user: ${userId}`);
    return { message: "No reduction required." };
  }

  const providerToReduce = scalingPlan.recommendedProvider;

  if (!providerToReduce) {
    console.warn(`⚠️ No recommended provider for reduction. AI needs more data.`);
    return { message: "AI couldn"t determine the best provider to reduce." };
  }

  try {
    console.log(`🔄 Reducing storage allocation for user ${userId} via provider: ${providerToReduce}`);

    // Here we assume an API exists to reduce storage allocation
    await axios.post(`${scalingPlan.providerDetails.apiUrl}/reduce-storage`, {
      userId,
      provider: providerToReduce,
    });

    reductionResult = { message: `Reduced storage allocation for provider ${providerToReduce}.` };

    // AI Logs Learning: Store reduction insights
    await aiLearningManager.logAILearning(userId, "storage_reduction", { reductionResult });

    return reductionResult;
  } catch (error) {
    console.error("❌ Error reducing storage:", error.message);
    throw new Error("AI storage reduction failed.");
  }
};

/**
 * Runs a full storage optimization cycle.
 * @param {string} userId - The user requesting full optimization.
 * @returns {object} - AI-driven storage optimization plan.
 */
const optimizeStorageUsage = async (userId) => {
  console.log(`🔄 AI running full storage optimization cycle for user: ${userId}`);

  const expansionResult = await expandStorageAutomatically(userId);
  const reductionResult = await reduceUnusedStorage(userId);

  const optimizationPlan = {
    expansion: expansionResult,
    reduction: reductionResult,
  };

  // AI Logs Learning: Store optimization cycle insights
  await aiLearningManager.logAILearning(userId, "storage_optimization_cycle", { optimizationPlan });

  return optimizationPlan;
};

export {
  scaleStorageAutomatically,
  expandStorageAutomatically,
  reduceUnusedStorage,
  optimizeStorageUsage,
};
