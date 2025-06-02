import { getAllStorageProviders } from "../config/dynamicStorageManager.mjs";
import aiLearningManager from "./aiLearningManager.mjs";
import axios from "axios";

/**
 * AI-driven billing calculation for storage usage.
 * @param {string} userId - The user being billed.
 * @returns {object} - AI-generated billing report.
 */
const calculateStorageBilling = async (userId) => {
  console.log(`💳 AI calculating storage billing for user: ${userId}`);

  const storageProviders = getAllStorageProviders();
  let billingReport = {};

  // AI-generated billing analysis
  const aiPrompt = `Generate storage billing details for:
  - User ID: ${userId}
  - Current Storage Providers & Usage: ${JSON.stringify(storageProviders, null, 2)}

  Calculate total cost, provider-wise breakdown, and identify any overages or discounts.
  Respond in JSON format with keys: 'cost_per_provider', 'total_bill', 'overage_charges', 'discounts_applied'.`;

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

    billingReport = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store billing insights
    await aiLearningManager.logAILearning(userId, "storage_billing_calculation", { billingReport });

    console.log(`✅ AI Billing Report for User ${userId}:`, billingReport);
    return { billingReport };
  } catch (error) {
    console.error("❌ Error generating AI-driven storage billing:", error.message);
    throw new Error("AI billing calculation failed.");
  }
};

/**
 * AI-driven chargeback processing for incorrect or disputed charges.
 * @param {string} userId - The user requesting a chargeback.
 * @param {string} disputeReason - The reason for the dispute.
 * @returns {object} - AI-driven chargeback decision.
 */
const processStorageChargeback = async (userId, disputeReason) => {
  console.log(`⚠️ AI processing chargeback for user: ${userId}`);

  let chargebackDecision = {};

  // AI-generated chargeback analysis
  const aiPrompt = `Process storage chargeback for:
  - User ID: ${userId}
  - Dispute Reason: ${disputeReason}

  Validate the claim, analyze storage usage, and decide if a refund or adjustment is necessary.
  Respond in JSON format with keys: 'chargeback_approved', 'adjusted_bill', 'decision_reason'.`;

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

    chargebackDecision = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store chargeback processing decisions
    await aiLearningManager.logAILearning(userId, "storage_chargeback_processing", { chargebackDecision });

    console.log(`✅ AI Chargeback Decision for User ${userId}:`, chargebackDecision);
    return { chargebackDecision };
  } catch (error) {
    console.error("❌ Error processing AI-driven storage chargeback:", error.message);
    throw new Error("AI chargeback processing failed.");
  }
};

/**
 * AI-generated billing forecast for future storage usage.
 * @param {string} userId - The user whose billing is being predicted.
 * @returns {object} - AI-generated billing forecast.
 */
const predictStorageBilling = async (userId) => {
  console.log(`📈 AI predicting future storage billing for user: ${userId}`);

  const billingAnalysis = await calculateStorageBilling(userId);
  let billingForecast = {};

  // AI-generated billing prediction
  const aiPrompt = `Predict future storage billing for:
  - User ID: ${userId}
  - Current Billing Data: ${JSON.stringify(billingAnalysis, null, 2)}

  Forecast next 6 months' storage expenses based on trends. Respond in JSON format with keys: 
  'predicted_monthly_bill', 'expected_trends', 'cost_reduction_opportunities'.`;

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

    billingForecast = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store billing forecast insights
    await aiLearningManager.logAILearning(userId, "storage_billing_forecasting", { billingForecast });

    console.log(`📊 AI Billing Forecast for User ${userId}:`, billingForecast);
    return { billingForecast };
  } catch (error) {
    console.error("❌ Error predicting AI-driven storage billing:", error.message);
    throw new Error("AI billing forecasting failed.");
  }
};

export {
  calculateStorageBilling,
  processStorageChargeback,
  predictStorageBilling,
};
