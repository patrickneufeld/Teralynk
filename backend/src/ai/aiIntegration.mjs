import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// ✅ FILE: /backend/src/ai/aiIntegration.js

import axios from 'axios';
import db from '../config/db.mjs';
import { logAILearning } from './aiLearningManager.mjs';
import Joi from 'joi';
import crypto from 'crypto';

/**
 * ✅ Fingerprint an AI prompt using SHA-256
 * Used for deduplication, caching, tracking
 * @param {string} prompt - The full text of the prompt
 * @returns {string} - Hexadecimal fingerprint
 */
export function fingerprintPrompt(prompt) {
  if (typeof prompt !== 'string' || prompt.length === 0) {
    throw new Error('Cannot fingerprint an empty prompt');
  }

  return crypto.createHash('sha256').update(prompt).digest('hex');
}

/**
 * ✅ Validate AI Query Input
 * Ensures payload structure is correct before sending to external platforms.
 */
export function validateQueryInput(input) {
  const schema = Joi.object({
    prompt: Joi.string().min(5).max(10000).required(),
    model: Joi.string().valid('openai', 'anthropic', 'bedrock', 'nova').required(),
    context: Joi.object().optional(),
    metadata: Joi.object().optional()
  });

  const { error, value } = schema.validate(input);
  if (error) {
    throw new Error(`Validation failed: ${error.message}`);
  }
  return value;
}

class AIIntegration {
  constructor() {
    this.userModels = new Map();
    this.platformModel = {};
  }

  async initializePlatformModel() {
    try {
      const modelData = await db.query("SELECT * FROM platform_model");
      this.platformModel = modelData.rows[0] || {};
    } catch (error) {
      console.error("❌ Error initializing platform model:", error.message);
    }
  }

  async getUserModel(userId) {
    if (!this.userModels.has(userId)) {
      try {
        const userModel = await db.query("SELECT * FROM user_models WHERE user_id = $1", [userId]);
        this.userModels.set(userId, userModel.rows[0] || {});
      } catch (error) {
        console.error(`❌ Error fetching model for user ${userId}:`, error.message);
        this.userModels.set(userId, {});
      }
    }
    return this.userModels.get(userId);
  }

  async updateUserModel(userId, data) {
    try {
      const userModel = await this.getUserModel(userId);
      const updatedModel = { ...userModel, ...data };
      await db.query("UPDATE user_models SET data = $1 WHERE user_id = $2", [updatedModel, userId]);
      this.userModels.set(userId, updatedModel);
    } catch (error) {
      console.error(`❌ Error updating model for user ${userId}:`, error.message);
    }
  }

  async updatePlatformModel(data) {
    try {
      this.platformModel = { ...this.platformModel, ...data };
      await db.query("UPDATE platform_model SET data = $1 WHERE id = 1", [this.platformModel]);
    } catch (error) {
      console.error("❌ Error updating platform model:", error.message);
    }
  }

  async queryAIPlatforms(userId, queries) {
    try {
      const responses = await Promise.all(
        queries.map(async ({ platform, payload, apiKey }) => {
          const url = `https://api.${platform}.com/v1/query`;
          const response = await axios.post(url, payload, {
            headers: { Authorization: `Bearer ${apiKey}` },
          });

          await logAILearning(userId, platform, { query: payload, response: response.data });
          return response.data;
        })
      );

      return responses;
    } catch (error) {
      console.error("❌ Error querying AI platforms:", error.message);
      return [];
    }
  }

  async storeInsights(userId, insights) {
    try {
      await db.query(
        "INSERT INTO ai_insights (user_id, insights, timestamp) VALUES ($1, $2, NOW())",
        [userId, JSON.stringify(insights)]
      );
      console.log(`✅ AI insights stored for user: ${userId}`);
    } catch (error) {
      console.error(`❌ Error storing AI insights for user ${userId}:`, error.message);
    }
  }

  async getStoredInsights(userId) {
    try {
      const result = await db.query(
        "SELECT insights FROM ai_insights WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 1",
        [userId]
      );
      return result.rows[0] ? JSON.parse(result.rows[0].insights) : {};
    } catch (error) {
      console.error(`❌ Error retrieving stored insights for user ${userId}:`, error.message);
      return {};
    }
  }

  async refinePredictions(userId) {
    try {
      const pastInteractions = await db.query(
        "SELECT * FROM ai_interactions WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 10",
        [userId]
      );

      if (!pastInteractions.rows.length) {
        console.log(`⚠️ No past interactions found for user: ${userId}`);
        return null;
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
      console.error(`❌ Error refining predictions for user ${userId}:`, error.message);
      return null;
    }
  }
}

// ✅ Singleton Export
const aiIntegrationSingleton = new AIIntegration();
await aiIntegrationSingleton.initializePlatformModel();

// ✅ Named Exports
export const getUserModel = (userId) => aiIntegrationSingleton.getUserModel(userId);
export const updateUserModel = (userId, data) => aiIntegrationSingleton.updateUserModel(userId, data);
export const updatePlatformModel = (data) => aiIntegrationSingleton.updatePlatformModel(data);
export const queryAIPlatforms = (userId, queries) => aiIntegrationSingleton.queryAIPlatforms(userId, queries);
export const storeInsights = (userId, insights) => aiIntegrationSingleton.storeInsights(userId, insights);
export const getStoredInsights = (userId) => aiIntegrationSingleton.getStoredInsights(userId);
export const refinePredictions = (userId) => aiIntegrationSingleton.refinePredictions(userId);

// ✅ Default Export
export default aiIntegrationSingleton;
