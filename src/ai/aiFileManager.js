// File Path: /Users/patrick/Projects/Teralynk/backend/src/ai/aiLearningManager.js

require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const db = require("../config/db");

/**
 * Log AI learning progress and user interactions.
 * This tracks AI recommendations and actual user responses to refine future suggestions.
 * @param {string} userId - User making the request.
 * @param {string} action - The AI action performed.
 * @param {object} details - Additional details (e.g., suggested file name, storage choice, etc.).
 */
const logAILearning = async (userId, action, details) => {
  try {
    await db.logInteraction({
      userId,
      action,
      details,
      timestamp: new Date(),
    });

    console.log(`✅ AI Learning Logged: ${action} - User: ${userId}`);
  } catch (error) {
    console.error("❌ Error logging AI learning:", error.message);
  }
};

/**
 * Analyze AI performance and update its own code.
 * AI will self-adjust based on success rates of past decisions.
 */
const analyzeAndUpdateAI = async () => {
  try {
    console.log("🚀 AI Self-Analysis Running...");

    // Fetch past AI interactions
    const pastInteractions = await db.getRecentInteractions();

    // Identify patterns in successful vs. failed decisions
    const analysisPrompt = `Analyze the following AI interactions and suggest optimizations for improving performance. 
    Focus on reducing errors, improving predictions, and enhancing storage decisions.\n\n${JSON.stringify(pastInteractions)}`;

    const response = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        model: "gpt-4",
        prompt: analysisPrompt,
        max_tokens: 800,
        temperature: 0.3,
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );

    const aiSuggestions = response.data.choices[0].text.trim();
    console.log(`🤖 AI Self-Improvement Suggestions:\n${aiSuggestions}`);

    // Apply AI-generated optimizations (if applicable)
    const updatePath = path.join(__dirname, "aiOptimizations.json");
    fs.writeFileSync(updatePath, JSON.stringify({ lastUpdate: new Date(), suggestions: aiSuggestions }, null, 2));

    return aiSuggestions;
  } catch (error) {
    console.error("❌ AI Self-Improvement Failed:", error.message);
  }
};

/**
 * Automate AI Code Updates
 * If AI detects an inefficient approach, it will rewrite specific functions to improve its performance.
 */
const autoUpdateAI = async () => {
  try {
    console.log("🔧 AI Auto-Updating its own logic...");
    const aiOptimizations = JSON.parse(fs.readFileSync(path.join(__dirname, "aiOptimizations.json"), "utf-8"));

    if (!aiOptimizations || !aiOptimizations.suggestions) {
      console.log("⚠️ No AI improvements detected yet.");
      return;
    }

    // Example of applying an AI-generated optimization (placeholder logic)
    const optimizationPrompt = `Update the AI file management system based on the following improvement:\n\n${aiOptimizations.suggestions}\n\nReturn the updated JavaScript function code only.`;

    const response = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        model: "gpt-4",
        prompt: optimizationPrompt,
        max_tokens: 1000,
        temperature: 0.3,
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );

    const updatedCode = response.data.choices[0].text.trim();
    console.log(`🚀 AI Auto-Updated Code:\n${updatedCode}`);

    // (Optional) Apply the update dynamically (requires careful validation)
    // eval(updatedCode); // ⚠️ Only enable if running in a secured environment.

    return updatedCode;
  } catch (error) {
    console.error("❌ AI Auto-Update Failed:", error.message);
  }
};

/**
 * Full AI Self-Learning Cycle
 * Runs all AI improvement steps and applies updates where needed.
 */
const runAISelfImprovement = async () => {
  console.log("\n🔍 Running Full AI Self-Learning Cycle...\n");
  await analyzeAndUpdateAI();
  await autoUpdateAI();
};

module.exports = {
  logAILearning,
  analyzeAndUpdateAI,
  autoUpdateAI,
  runAISelfImprovement,
};
