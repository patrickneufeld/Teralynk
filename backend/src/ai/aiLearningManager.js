import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "../config/db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ✅ Log AI learning progress and user interactions.
 * @param {string} userId - User making the request.
 * @param {string} action - The AI action performed.
 * @param {object} details - Additional details (e.g., suggested file name, storage choice, etc.).
 */
export const logAILearning = async (userId, action, details) => {
  try {
    await db.query("INSERT INTO ai_logs (user_id, action, details, timestamp) VALUES ($1, $2, $3, NOW())", [
      userId,
      action,
      JSON.stringify(details),
    ]);
    console.log(`✅ AI Learning Logged: ${action} - User: ${userId}`);
  } catch (error) {
    console.error("❌ Error logging AI learning:", error.message);
  }
};

/**
 * ✅ Analyze AI performance and update its own code.
 */
export const analyzeAndUpdateAI = async () => {
  try {
    console.log("🚀 AI Self-Analysis Running...");

    // Fetch past AI interactions
    const pastInteractions = await db.query(
      "SELECT * FROM ai_logs ORDER BY timestamp DESC LIMIT 10"
    );

    if (!pastInteractions.rows.length) {
      console.log("⚠️ No past interactions found for AI analysis.");
      return;
    }

    const analysisPrompt = `Analyze the following AI interactions and suggest optimizations:\n\n${JSON.stringify(
      pastInteractions.rows
    )}`;

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

    const aiSuggestions = response.data?.choices?.[0]?.text?.trim() || "No valid suggestions returned.";
    console.log(`🤖 AI Self-Improvement Suggestions:\n${aiSuggestions}`);

    // ✅ Store AI-generated optimizations
    const updatePath = path.join(__dirname, "aiOptimizations.json");
    fs.writeFileSync(updatePath, JSON.stringify({ lastUpdate: new Date(), suggestions: aiSuggestions }, null, 2));

    return aiSuggestions;
  } catch (error) {
    console.error("❌ AI Self-Improvement Failed:", error.message);
  }
};

/**
 * ✅ Automate AI Code Updates
 */
export const autoUpdateAI = async () => {
  try {
    console.log("🔧 AI Auto-Updating its own logic...");

    const updatePath = path.join(__dirname, "aiOptimizations.json");
    if (!fs.existsSync(updatePath)) {
      console.log("⚠️ No AI optimizations file found.");
      return;
    }

    const aiOptimizations = JSON.parse(fs.readFileSync(updatePath, "utf-8"));

    if (!aiOptimizations.suggestions) {
      console.log("⚠️ No AI improvements detected yet.");
      return;
    }

    const optimizationPrompt = `Update the AI system based on the following improvement:\n\n${aiOptimizations.suggestions}`;

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

    const updatedCode = response.data?.choices?.[0]?.text?.trim() || "No valid updates returned.";
    console.log(`🚀 AI Auto-Updated Code:\n${updatedCode}`);

    return updatedCode;
  } catch (error) {
    console.error("❌ AI Auto-Update Failed:", error.message);
  }
};

/**
 * ✅ Full AI Self-Learning Cycle
 */
export const runAISelfImprovement = async () => {
  console.log("\n🔍 Running Full AI Self-Learning Cycle...\n");
  await analyzeAndUpdateAI();
  await autoUpdateAI();
};
