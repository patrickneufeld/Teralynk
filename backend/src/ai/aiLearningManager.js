const AIIntegration = require('./aiIntegration');
const db = require('../db');

class AILearningManager {
  /**
   * Log and process an AI interaction.
   * @param {string} userId - User's unique identifier.
   * @param {string} platform - The name of the AI platform queried.
   * @param {Object} request - The payload sent to the AI platform.
   * @param {Object} response - The response received from the AI platform.
   */
  async logAIInteraction(userId, platform, request, response) {
    try {
      // Log interaction to the database
      await db.logInteraction({
        userId,
        platform,
        request,
        response,
        timestamp: new Date(),
      });

      // Extract learning data
      const userData = this.extractLearningData(request, response);
      const platformData = this.extractPlatformLearningData(request, response);

      // Update learning models
      await AIIntegration.updateUserModel(userId, userData);
      await AIIntegration.updatePlatformModel(platformData);

      console.log(`AI interaction logged and processed for user: ${userId}`);
    } catch (error) {
      console.error('Error processing AI interaction:', error);
      throw new Error("Error logging AI interaction");
    }
  }

  /**
   * Analyze user feedback and adjust learning models.
   * @param {string} userId - User's unique identifier.
   * @param {Object} feedback - Feedback data.
   */
  async processFeedback(userId, feedback) {
    try {
      const userModel = await AIIntegration.getUserModel(userId);
      const updatedModel = this.adaptModel(userModel, feedback);
      await AIIntegration.updateUserModel(userId, updatedModel);
      console.log(`Feedback processed for user ${userId}`);
    } catch (error) {
      console.error("Error processing feedback:", error);
      throw new Error("Error processing feedback");
    }
  }

  /**
   * Self-improvement mechanism to query ChatGPT for advice.
   * @param {string} userId - User's unique identifier.
   * @param {Object} queryDetails - Details of the user query and AI's response.
   */
  async selfImprove(userId, queryDetails) {
    const { query, response } = queryDetails;

    try {
      // Ensure the query and response are valid
      if (!query || !response) {
        throw new Error('Invalid query or response in selfImprove');
      }

      // Query ChatGPT for advice
      const advice = await AIIntegration.queryChatGPTForAdvice(query, response);

      // Log the advice and update the model
      const userModel = await AIIntegration.getUserModel(userId);
      const updatedModel = {
        ...userModel,
        improvementLogs: [...(userModel.improvementLogs || []), { query, response, advice }],
      };

      await AIIntegration.updateUserModel(userId, updatedModel);
      console.log("Self-improvement advice logged and model updated.");
    } catch (error) {
      console.error("Error during self-improvement process:", error);
      throw new Error("Self-improvement failed");
    }
  }

  /**
   * Detect if the AI requires improvement for a given response.
   * @param {Object} response - The AI's response to analyze.
   * @returns {boolean} - Whether self-improvement is needed.
   */
  needsImprovement(response) {
    // Example: Check if the response is empty or flagged as low confidence
    return !response || response.confidence < 0.5;
  }

  /**
   * Adjust a model based on feedback or advice.
   * @param {Object} model - Existing model data.
   * @param {Object} feedback - Feedback or advice data to incorporate.
   * @returns {Object} - Updated model data.
   */
  adaptModel(model, feedback) {
    // Example: Increment weights for positively rated topics
    if (feedback.rating === "positive") {
      model.topics[feedback.topic] = (model.topics[feedback.topic] || 0) + 1;
    } else if (feedback.rating === "negative") {
      model.topics[feedback.topic] = Math.max((model.topics[feedback.topic] || 1) - 1, 0);
    }
    return model;
  }

  /**
   * Extract learning data for the user-specific model.
   * @param {Object} request - The payload sent to the AI platform.
   * @param {Object} response - The response received from the AI platform.
   * @returns {Object} - Data to update the user-specific model.
   */
  extractLearningData(request, response) {
    return {
      recentQuery: request.query || '',
      responseSummary: response.summary || '',
      preferences: this.analyzeResponse(response),
    };
  }

  /**
   * Extract learning data for the platform-wide model.
   * @param {Object} request - The payload sent to the AI platform.
   * @param {Object} response - The response received from the AI platform.
   * @returns {Object} - Data to update the platform-wide model.
   */
  extractPlatformLearningData(request, response) {
    return {
      commonQueries: [request.query],
      commonResponses: [response.summary],
    };
  }

  /**
   * Analyze an AI response to extract user preferences or patterns.
   * @param {Object} response - The AI platform's response.
   * @returns {Object} - Inferred user preferences or patterns.
   */
  analyzeResponse(response) {
    if (response.keywords) {
      return { preferredTopics: response.keywords };
    }
    return {};
  }
}

module.exports = new AILearningManager();
