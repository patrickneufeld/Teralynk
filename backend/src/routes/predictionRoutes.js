// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/predictionRoutes.js

const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const aiPredictionManager = require("../ai/aiPredictionManager");
const aiLearningManager = require("../ai/aiLearningManager");

const router = express.Router();

/**
 * Route: GET /api/predictions/recommend-api
 * Description: AI recommends external APIs based on user behavior.
 */
router.get("/recommend-api", authenticate, async (req, res) => {
  const { userId } = req.user;

  try {
    console.log(`🤖 AI Analyzing API Recommendations for User: ${userId}`);

    // AI evaluates the best API integrations for the user
    const recommendedAPIs = await aiPredictionManager.recommendAPIs(userId);

    // Log AI learning from recommendation patterns
    await aiLearningManager.logAILearning(userId, "api_recommendation", { recommendedAPIs });

    res.status(200).json({ message: "API recommendations generated successfully", recommendedAPIs });
  } catch (error) {
    console.error("Error generating API recommendations:", error.message);
    res.status(500).json({ error: "Failed to generate API recommendations." });
  }
});

/**
 * Route: GET /api/predictions/usage-patterns
 * Description: AI analyzes platform-wide API usage trends.
 */
router.get("/usage-patterns", authenticate, async (req, res) => {
  const { userId } = req.user;

  try {
    console.log(`📊 AI Analyzing Platform API Usage Patterns`);

    // AI detects trends in API usage across all users
    const apiTrends = await aiPredictionManager.analyzeUsagePatterns();

    res.status(200).json({ message: "API usage trends retrieved successfully", apiTrends });
  } catch (error) {
    console.error("Error analyzing API usage patterns:", error.message);
    res.status(500).json({ error: "Failed to analyze API usage patterns." });
  }
});

/**
 * Route: GET /api/predictions/adaptive-recommendations
 * Description: AI provides personalized adaptive recommendations for users.
 */
router.get("/adaptive-recommendations", authenticate, async (req, res) => {
  const { userId } = req.user;

  try {
    console.log(`🔮 AI Generating Adaptive API Recommendations for User: ${userId}`);

    // AI dynamically adapts recommendations based on the user's evolving needs
    const adaptiveRecommendations = await aiPredictionManager.generateAdaptiveRecommendations(userId);

    // Log AI learning from adaptive recommendations
    await aiLearningManager.logAILearning(userId, "adaptive_api_recommendation", { adaptiveRecommendations });

    res.status(200).json({ message: "Adaptive recommendations generated successfully", adaptiveRecommendations });
  } catch (error) {
    console.error("Error generating adaptive recommendations:", error.message);
    res.status(500).json({ error: "Failed to generate adaptive recommendations." });
  }
});

module.exports = router;
