// File Path: /Users/patrick/Projects/Teralynk/backend/src/ai/aiStorageMonitor.js

const { getAllStorageProviders, updateTotalStorage } = require("../config/dynamicStorageManager");
const aiLearningManager = require("./aiLearningManager");
const axios = require("axios");

/**
 * Monitors storage provider health and performance in real-time.
 * AI detects potential failures, optimizes usage, and learns from past trends.
 * @returns {object} - AI-driven storage monitoring insights.
 */
const monitorStorageUsage = async () => {
  console.log("📡 AI monitoring storage provider health...");

  await updateTotalStorage();
  const storageProviders = getAllStorageProviders();
  let monitoringResults = [];

  // AI-generated monitoring analysis
  const aiPrompt = `Analyze storage provider health:
  - Storage Providers: ${JSON.stringify(storageProviders, null, 2)}

  Detect performance issues, predict failures, and recommend optimizations.
  Provide the response in JSON format with keys: 'issues_detected', 'recommendations', 'priority_actions'.`;

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

    monitoringResults = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store monitoring insights
    await aiLearningManager.logAILearning("platform", "storage_monitoring", { monitoringResults });

    console.log("✅ AI Storage Monitoring Insights:", monitoringResults);
    return { monitoringResults };
  } catch (error) {
    console.error("❌ Error monitoring storage providers:", error.message);
    throw new Error("AI storage monitoring failed.");
  }
};

/**
 * Detects early warning signs of potential storage failures.
 * AI identifies risky storage providers and suggests preventive actions.
 * @returns {object} - AI-driven failure detection insights.
 */
const detectStorageFailures = async () => {
  console.log("🔍 AI detecting potential storage failures...");

  const monitoringData = await monitorStorageUsage();
  let detectedIssues = [];

  // AI-generated issue detection strategy
  const aiPrompt = `Evaluate storage provider health:
  - Monitoring Data: ${JSON.stringify(monitoringData, null, 2)}

  Identify early signs of failures, degraded performance, or potential outages.
  Recommend preventive actions. Respond in JSON format with keys: 'risks_detected', 'preventive_measures'.`;

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

    detectedIssues = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store detected storage issues
    await aiLearningManager.logAILearning("platform", "storage_issue_detection", { detectedIssues });

    console.log("⚠️ AI Detected Storage Issues:", detectedIssues);
    return { detectedIssues };
  } catch (error) {
    console.error("❌ Error detecting storage failures:", error.message);
    throw new Error("AI storage failure detection failed.");
  }
};

/**
 * AI optimizes storage performance dynamically based on real-time monitoring.
 * Adjusts usage, reallocates storage, and prevents future failures.
 * @returns {object} - AI-driven storage optimization strategy.
 */
const optimizeStoragePerformance = async () => {
  console.log("🚀 AI optimizing storage performance...");

  const monitoringData = await monitorStorageUsage();
  let optimizationPlan = [];

  // AI-generated optimization strategy
  const aiPrompt = `Optimize storage performance:
  - Monitoring Data: ${JSON.stringify(monitoringData, null, 2)}

  Suggest adjustments to improve storage efficiency, balance load, and prevent failures.
  Provide JSON response with keys: 'performance_tweaks', 'resource_allocation', 'critical_adjustments'.`;

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

    optimizationPlan = JSON.parse(response.data.choices[0].text.trim());

    // AI Logs Learning: Store storage optimization strategies
    await aiLearningManager.logAILearning("platform", "storage_optimization", { optimizationPlan });

    console.log("📊 AI Storage Optimization Plan:", optimizationPlan);
    return { optimizationPlan };
  } catch (error) {
    console.error("❌ Error optimizing storage performance:", error.message);
    throw new Error("AI storage optimization failed.");
  }
};

/**
 * Runs a complete AI-powered storage maintenance cycle.
 * Monitors health, detects failures, and optimizes performance.
 * @returns {object} - AI-driven storage maintenance report.
 */
const runStorageMaintenance = async () => {
  console.log("🔄 Running full AI storage maintenance cycle...");

  const monitoring = await monitorStorageUsage();
  const failureDetection = await detectStorageFailures();
  const optimization = await optimizeStoragePerformance();

  const maintenanceReport = {
    monitoring,
    failureDetection,
    optimization,
  };

  // AI Logs Learning: Store full maintenance cycle insights
  await aiLearningManager.logAILearning("platform", "storage_maintenance", { maintenanceReport });

  return maintenanceReport;
};

module.exports = {
  monitorStorageUsage,
  detectStorageFailures,
  optimizeStoragePerformance,
  runStorageMaintenance,
};
