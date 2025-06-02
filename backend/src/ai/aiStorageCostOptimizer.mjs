// File Path: /Users/patrick/Projects/Teralynk/backend/src/ai/aiStorageCostOptimizer.js

import { getAllStorageProviders } from "../config/dynamicStorageManager.mjs";
import aiLearningManager from "./aiLearningManager.mjs";
import axios from "axios";

/**
 * AI-driven cost analysis across all storage providers.
 * @param {string} userId - The user requesting cost optimization.
 * @returns {object} - AI-generated cost breakdown.
 */
const analyzeStorageCosts = async (userId) => {
  console.log(`💰 AI analyzing storage costs for user: ${userId}`);

  const storageProviders = getAllStorageProviders();
  let costBreakdown = {};

  // AI-generated cost analysis
  const aiPrompt = `Analyze storage cost efficiency for:
  - User ID: ${userId}
  - Current Storage Providers & Pricing: ${JSON.stringify(storageProviders, null, 2)}

  Provide a cost breakdown per provider and suggest the most budget-friendly options.
  Respond in JSON format with keys: 'cost_per_provider', 'total_monthly_expense', 'savings_opportunities'.`;

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

    costBreakdown = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store cost analysis insights
    await aiLearningManager.logAILearning(userId, "storage_cost_analysis", { costBreakdown });

    console.log(`✅ AI Cost Analysis for User ${userId}:`, costBreakdown);
    return { costBreakdown };
  } catch (error) {
    console.error("❌ Error analyzing AI-driven storage costs:", error.message);
    throw new Error("AI cost analysis failed.");
  }
};

/**
 * AI-driven automatic budget allocation for storage.
 * @param {string} userId - The user requesting budget optimization.
 * @returns {object} - AI-generated budget allocation plan.
 */
const optimizeStorageBudget = async (userId) => {
  console.log(`📊 AI optimizing storage budget for user: ${userId}`);

  const costAnalysis = await analyzeStorageCosts(userId);
  let budgetPlan = {};

  // AI-generated budget allocation strategy
  const aiPrompt = `Optimize storage budget for:
  - User ID: ${userId}
  - Cost Analysis Data: ${JSON.stringify(costAnalysis, null, 2)}

  Reallocate budget to the most cost-efficient providers while ensuring storage availability.
  Respond in JSON format with keys: 'optimized_budget_allocation', 'recommended_providers', 'potential_savings'.`;

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

    budgetPlan = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store budget optimization insights
    await aiLearningManager.logAILearning(userId, "storage_budget_optimization", { budgetPlan });

    console.log(`✅ AI Budget Optimization for User ${userId}:`, budgetPlan);
    return { budgetPlan };
  } catch (error) {
    console.error("❌ Error optimizing AI-driven storage budget:", error.message);
    throw new Error("AI budget optimization failed.");
  }
};

/**
 * Predicts future storage expenses based on trends.
 * @param {string} userId - The user whose costs are predicted.
 * @returns {object} - AI-generated cost forecast.
 */
const predictStorageExpenses = async (userId) => {
  console.log(`📈 AI predicting future storage expenses for user: ${userId}`);

  const costAnalysis = await analyzeStorageCosts(userId);
  let expenseForecast = {};

  // AI-generated cost forecasting
  const aiPrompt = `Predict storage expenses for:
  - User ID: ${userId}
  - Cost Analysis Data: ${JSON.stringify(costAnalysis, null, 2)}

  Provide an expense forecast for the next 6 months and recommend actions to reduce costs.
  Respond in JSON format with keys: 'predicted_expenses', 'expected_trends', 'cost_reduction_suggestions'.`;

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

    expenseForecast = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store expense predictions
    await aiLearningManager.logAILearning(userId, "storage_cost_forecasting", { expenseForecast });

    console.log(`📊 AI Storage Cost Forecast for User ${userId}:`, expenseForecast);
    return { expenseForecast };
  } catch (error) {
    console.error("❌ Error predicting AI-driven storage expenses:", error.message);
    throw new Error("AI cost forecasting failed.");
  }
};

export {
  analyzeStorageCosts,
  optimizeStorageBudget,
  predictStorageExpenses,
};
