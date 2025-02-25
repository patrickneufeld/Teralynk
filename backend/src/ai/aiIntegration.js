// File: /Users/patrick/Projects/Teralynk/backend/src/ai/aiIntegration.js

const axios = require('axios');
const db = require('../db'); // Assuming database module is in /src/db
const AILearningManager = require('./aiLearningManager'); // Learning manager module

/**
 * AI Integration Module
 * Handles individual and platform-level AI learning and query processing.
 */
class AIIntegration {
  constructor() {
    this.userModels = new Map(); // Map to store user-specific learning models
    this.platformModel = {}; // Global model for platform-level insights
  }

  /**
   * Initialize the platform-wide learning model.
   */
  async initializePlatformModel() {
    try {
      const modelData = await db.getPlatformModel();
      this.platformModel = modelData || {};
    } catch (error) {
      console.error('Error initializing platform model:', error);
    }
  }

  /**
   * Get or create a user-specific model.
   * @param {string} userId - User's unique identifier.
   */
  async getUserModel(userId) {
    if (!this.userModels.has(userId)) {
      try {
        const userModel = await db.getUserModel(userId);
        this.userModels.set(userId, userModel || {});
      } catch (error) {
        console.error(`Error fetching model for user ${userId}:`, error);
        this.userModels.set(userId, {});
      }
    }
    return this.userModels.get(userId);
  }

  /**
   * Update the user-specific model with new data.
   * @param {string} userId - User's unique identifier.
   * @param {Object} data - Data to update the model with.
   */
  async updateUserModel(userId, data) {
    try {
      const userModel = await this.getUserModel(userId);
      const updatedModel = { ...userModel, ...data }; // Merge new data into the model
      await db.updateUserModel(userId, updatedModel);
      this.userModels.set(userId, updatedModel);
    } catch (error) {
      console.error(`Error updating model for user ${userId}:`, error);
    }
  }

  /**
   * Update the platform-level model with new data.
   * @param {Object} data - Data to update the platform model with.
   */
  async updatePlatformModel(data) {
    try {
      this.platformModel = { ...this.platformModel, ...data };
      await db.updatePlatformModel(this.platformModel);
    } catch (error) {
      console.error('Error updating platform model:', error);
    }
  }

  /**
   * Query multiple AI platforms simultaneously.
   * Logs requests and responses for learning purposes.
   * @param {string} userId - The user's unique identifier.
   * @param {Array<Object>} queries - Array of queries for different platforms.
   */
  async queryAIPlatforms(userId, queries) {
    try {
      const responses = await Promise.all(
        queries.map(async (query) => {
          const { platform, payload, apiKey } = query;
          const url = `https://api.${platform}.com/v1/query`; // Adjust based on platform's API
          const response = await axios.post(url, payload, {
            headers: { Authorization: `Bearer ${apiKey}` },
          });

          // Log the interaction for learning
          await AILearningManager.logAIInteraction(userId, platform, payload, response.data);

          return response.data;
        })
      );

      return responses;
    } catch (error) {
      console.error('Error querying AI platforms:', error);
      return [];
    }
  }
}

module.exports = new AIIntegration();
