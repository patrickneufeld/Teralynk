import axios from "axios";
import db from "../config/db.js"; 
import { logAILearning } from "./aiLearningManager.js";

class AIIntegration {
  constructor() {
    this.userModels = new Map(); // Store user-specific learning models
    this.platformModel = {}; // Store platform-wide insights
  }

  /**
   * ✅ Initialize the platform-wide learning model.
   */
  async initializePlatformModel() {
    try {
      const modelData = await db.query("SELECT * FROM platform_model");
      this.platformModel = modelData.rows[0] || {};
    } catch (error) {
      console.error("❌ Error initializing platform model:", error);
    }
  }

  /**
   * ✅ Get or create a user-specific model.
   * @param {string} userId - User's unique identifier.
   */
  async getUserModel(userId) {
    if (!this.userModels.has(userId)) {
      try {
        const userModel = await db.query("SELECT * FROM user_models WHERE user_id = $1", [userId]);
        this.userModels.set(userId, userModel.rows[0] || {});
      } catch (error) {
        console.error(`❌ Error fetching model for user ${userId}:`, error);
        this.userModels.set(userId, {});
      }
    }
    return this.userModels.get(userId);
  }

  /**
   * ✅ Update the user-specific model with new data.
   * @param {string} userId - User's unique identifier.
   * @param {Object} data - Data to update the model with.
   */
  async updateUserModel(userId, data) {
    try {
      const userModel = await this.getUserModel(userId);
      const updatedModel = { ...userModel, ...data };
      await db.query("UPDATE user_models SET data = $1 WHERE user_id = $2", [updatedModel, userId]);
      this.userModels.set(userId, updatedModel);
    } catch (error) {
      console.error(`❌ Error updating model for user ${userId}:`, error);
    }
  }

  /**
   * ✅ Update the platform-level model with new data.
   * @param {Object} data - Data to update the platform model with.
   */
  async updatePlatformModel(data) {
    try {
      this.platformModel = { ...this.platformModel, ...data };
      await db.query("UPDATE platform_model SET data = $1 WHERE id = 1", [this.platformModel]);
    } catch (error) {
      console.error("❌ Error updating platform model:", error);
    }
  }

  /**
   * ✅ Query multiple AI platforms simultaneously.
   * Logs requests and responses for learning purposes.
   * @param {string} userId - The user's unique identifier.
   * @param {Array<Object>} queries - Array of queries for different platforms.
   */
  async queryAIPlatforms(userId, queries) {
    try {
      const responses = await Promise.all(
        queries.map(async (query) => {
          const { platform, payload, apiKey } = query;
          const url = `https://api.${platform}.com/v1/query`; // Ensure correct API endpoint
          const response = await axios.post(url, payload, {
            headers: { Authorization: `Bearer ${apiKey}` },
          });

          // ✅ Log AI interaction for learning
          await logAILearning(userId, platform, { query: payload, response: response.data });

          return response.data;
        })
      );

      return responses;
    } catch (error) {
      console.error("❌ Error querying AI platforms:", error);
      return [];
    }
  }

  /**
   * ✅ Store AI-generated insights in the database.
   * @param {string} userId - User's unique identifier.
   * @param {Object} insights - AI-generated insights.
   */
  async storeInsights(userId, insights) {
    try {
      await db.query(
        "INSERT INTO ai_insights (user_id, insights, timestamp) VALUES ($1, $2, NOW())",
        [userId, JSON.stringify(insights)]
      );
      console.log(`✅ AI insights stored for user: ${userId}`);
    } catch (error) {
      console.error(`❌ Error storing AI insights for user ${userId}:`, error);
    }
  }

  /**
   * ✅ Retrieve stored AI insights for a user.
   * @param {string} userId - User's unique identifier.
   * @returns {Object} - Stored AI insights.
   */
  async getStoredInsights(userId) {
    try {
      const result = await db.query("SELECT insights FROM ai_insights WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 1", [userId]);
      return result.rows[0] ? JSON.parse(result.rows[0].insights) : {};
    } catch (error) {
      console.error(`❌ Error retrieving stored insights for user ${userId}:`, error);
      return {};
    }
  }

  /**
   * ✅ Analyze and refine AI predictions based on past user interactions.
   * @param {string} userId - User's unique identifier.
   */
  async refinePredictions(userId) {
    try {
      const pastInteractions = await db.query(
        "SELECT * FROM ai_interactions WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 10",
        [userId]
      );

      if (!pastInteractions.rows.length) {
        console.log(`⚠️ No past interactions found for user: ${userId}`);
        return;
      }

      const prompt = `Analyze the following AI interactions for ${userId} and suggest how to improve predictions:\n\n${JSON.stringify(
        pastInteractions.rows
      )}`;

      const response = await axios.post(
        "https://api.openai.com/v1/completions",
        {
          model: "gpt-4",
          prompt,
          max_tokens: 800,
          temperature: 0.3,
        },
        {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        }
      );

      const suggestions = response.data?.choices?.[0]?.text?.trim() || "No valid suggestions returned.";
      console.log(`🔍 AI Prediction Refinements for ${userId}:\n${suggestions}`);

      return suggestions;
    } catch (error) {
      console.error(`❌ Error refining predictions for user ${userId}:`, error);
      return null;
    }
  }
}

// ✅ Named exports for individual functions
export const getUserModel = (userId) => new AIIntegration().getUserModel(userId);
export const updateUserModel = (userId, data) => new AIIntegration().updateUserModel(userId, data);
export const updatePlatformModel = (data) => new AIIntegration().updatePlatformModel(data);
export const queryAIPlatforms = (userId, queries) => new AIIntegration().queryAIPlatforms(userId, queries);
export const storeInsights = (userId, insights) => new AIIntegration().storeInsights(userId, insights);
export const getStoredInsights = (userId) => new AIIntegration().getStoredInsights(userId);
export const refinePredictions = (userId) => new AIIntegration().refinePredictions(userId);

export default new AIIntegration();
