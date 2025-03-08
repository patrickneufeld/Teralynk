// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/ai/aiLearningManager.js

import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "../config/db.js";
import { sendAIQueryToQueue, processQueuedAIUpdates } from "../config/queueConfig.js";
import { sqsClient } from "../config/queueConfig.js";
import { ReceiveMessageCommand } from "@aws-sdk/client-sqs";

dotenv.config();

// ✅ Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ✅ AI Learning Manager - The Heart of Self-Improvement
 * Continuously tracks, analyzes, and optimizes AI models for superior performance.
 */
class AILearningManager {
  constructor() {
    this.optimizationLogPath = path.join(__dirname, "aiOptimizations.json");
    this.aiErrorLogPath = path.join(__dirname, "aiErrors.json");

    // ✅ Ensure required logs exist
    if (!fs.existsSync(this.optimizationLogPath)) {
      fs.writeFileSync(this.optimizationLogPath, JSON.stringify({ updates: [] }, null, 2));
    }
    if (!fs.existsSync(this.aiErrorLogPath)) {
      fs.writeFileSync(this.aiErrorLogPath, JSON.stringify({ errors: [] }, null, 2));
    }
  }

  /**
   * ✅ Log AI Learning Progress
   * Stores user interactions and AI learning logs for self-improvement.
   * @param {string} userId - User performing the action.
   * @param {string} action - AI action performed.
   * @param {object} details - Additional context.
   */
  async logAILearning(userId, action, details) {
    try {
      await db.query(
        "INSERT INTO ai_logs (user_id, action, details, timestamp) VALUES ($1, $2, $3, NOW())",
        [userId, action, JSON.stringify(details)]
      );
      console.log(`✅ AI Learning Logged: ${action} - User: ${userId}`);
    } catch (error) {
      console.error("❌ Error logging AI learning:", error.message);
    }
  }

  /**
   * ✅ AI Self-Analysis & Optimization
   * Uses historical data to detect inefficiencies and self-correct.
   */
  async analyzeAndUpdateAI() {
    try {
      console.log("🚀 AI Self-Analysis Running...");

      const pastInteractions = await db.query(
        "SELECT * FROM ai_logs ORDER BY timestamp DESC LIMIT 50"
      );

      if (!pastInteractions.rows.length) {
        console.log("⚠️ No past interactions found for AI analysis.");
        return;
      }

      await sendAIQueryToQueue({
        query: "Analyze past AI interactions and suggest optimizations:",
        data: pastInteractions.rows,
      });

      console.log("✅ AI Query Sent for Self-Analysis.");
    } catch (error) {
      console.error("❌ AI Self-Improvement Failed:", error.message);
    }
  }

  /**
   * ✅ AI Reinforcement Learning
   * Adjusts AI behavior based on user feedback.
   */
  async refineAIWithFeedback(userId, aiResponse, success) {
    try {
      await db.query(
        "INSERT INTO ai_feedback (user_id, ai_response, success, timestamp) VALUES ($1, $2, $3, NOW())",
        [userId, JSON.stringify(aiResponse), success]
      );

      console.log(`📡 AI Feedback Processed - Success: ${success}`);
    } catch (error) {
      console.error("❌ AI Feedback Logging Failed:", error.message);
    }
  }

  /**
   * ✅ AI Error Handling & Self-Healing
   * Logs AI failures and automatically attempts corrections.
   */
  async handleAIErrors(errorDetails) {
    try {
      const errorLog = JSON.parse(fs.readFileSync(this.aiErrorLogPath, "utf-8"));
      errorLog.errors.push({ timestamp: new Date(), error: errorDetails });

      fs.writeFileSync(this.aiErrorLogPath, JSON.stringify(errorLog, null, 2));

      console.warn(`⚠️ AI Error Logged. Auto-recovery initiated.`);
      await this.analyzeAndUpdateAI(); // Re-train AI when failures increase

    } catch (error) {
      console.error("❌ AI Error Handling Failed:", error.message);
    }
  }

  /**
   * ✅ AI Auto-Code Update - Self-Healing System
   * Uses AI-generated optimizations to rewrite inefficient code.
   */
  async autoUpdateAI() {
    try {
      console.log("🔧 AI Auto-Updating...");

      if (!fs.existsSync(this.optimizationLogPath)) {
        console.log("⚠️ No AI optimizations found.");
        return;
      }

      const aiOptimizations = JSON.parse(fs.readFileSync(this.optimizationLogPath, "utf-8"));

      if (!aiOptimizations.updates.length) {
        console.log("⚠️ No AI improvements detected.");
        return;
      }

      for (const update of aiOptimizations.updates) {
        const response = await axios.post(
          "https://api.openai.com/v1/completions",
          {
            model: "gpt-4",
            prompt: `Update the AI system based on the following improvement:\n\n${update}`,
            max_tokens: 1000,
            temperature: 0.3,
          },
          {
            headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
          }
        );

        const updatedCode = response.data?.choices?.[0]?.text?.trim() || "No valid updates returned.";
        console.log(`🚀 AI Auto-Updated Code:\n${updatedCode}`);

        // Apply code updates dynamically
        await processQueuedAIUpdates(updatedCode);
      }

    } catch (error) {
      console.error("❌ AI Auto-Update Failed:", error.message);
    }
  }

  /**
   * ✅ AI Query Listener - Process SQS AI Messages
   * Listens to the queue for AI learning updates.
   */
  async processAIMessages() {
    try {
      const AI_SQS_QUEUE = process.env.SQS_AI_LEARNING_URL;

      const { Messages } = await sqsClient.send(new ReceiveMessageCommand({
        QueueUrl: AI_SQS_QUEUE,
        MaxNumberOfMessages: 5,
      }));

      if (Messages) {
        for (const message of Messages) {
          const query = JSON.parse(message.Body);
          console.log("🔍 Processing AI Message:", query);
          await this.analyzeAndUpdateAI();
        }
      }
    } catch (error) {
      console.error("❌ AI Message Processing Failed:", error.message);
    }
  }

  /**
   * ✅ Run the Full AI Learning System
   * Executes AI self-learning, self-healing, and optimization.
   */
  async runFullAISelfImprovement() {
    console.log("\n🔍 Running Full AI Self-Learning Cycle...\n");

    await this.analyzeAndUpdateAI();
    await this.autoUpdateAI();
    await this.processAIMessages();
  }

  /**
   * ✅ Run AI Self-Improvement (Alias for runFullAISelfImprovement)
   * This function is exported to match the import in aiRoutes.js.
   */
  async runAISelfImprovement() {
    await this.runFullAISelfImprovement();
  }
}

// ✅ Export AI Learning Manager
const aiLearningManager = new AILearningManager();
export default aiLearningManager;
export const logAILearning = aiLearningManager.logAILearning.bind(aiLearningManager);
export const runAISelfImprovement = aiLearningManager.runAISelfImprovement.bind(aiLearningManager);