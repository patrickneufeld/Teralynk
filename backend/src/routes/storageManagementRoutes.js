// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/storageManagementRoutes.js

const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const aiStorageBalancer = require("../ai/aiStorageBalancer");
const aiLearningManager = require("../ai/aiLearningManager");

const router = express.Router();

/**
 * Route: GET /api/storage/balance
 * Description: AI optimizes storage load balancing across available providers.
 */
router.get("/balance", authenticate, async (req, res) => {
  const { userId } = req.user;

  try {
    console.log(`⚖️ AI balancing storage for user: ${userId}`);
    
    const balanceResult = await aiStorageBalancer.balanceStorageLoad(userId);

    // Log AI learning event
    await aiLearningManager.logAILearning(userId, "storage_balanced", balanceResult);

    res.status(200).json({ message: "Storage balancing completed successfully", balanceResult });
  } catch (error) {
    console.error("❌ Error balancing storage:", error.message);
    res.status(500).json({ error: "Failed to balance storage." });
  }
});

/**
 * Route: GET /api/storage/predict
 * Description: AI predicts future storage needs based on usage patterns.
 */
router.get("/predict", authenticate, async (req, res) => {
  const { userId } = req.user;

  try {
    console.log(`📊 AI predicting future storage needs for user: ${userId}`);
    
    const predictionResult = await aiStorageBalancer.predictStorageNeeds(userId);

    // Log AI learning event
    await aiLearningManager.logAILearning(userId, "storage_prediction", predictionResult);

    res.status(200).json({ message: "Storage prediction generated successfully", predictionResult });
  } catch (error) {
    console.error("❌ Error predicting storage needs:", error.message);
    res.status(500).json({ error: "Failed to predict storage needs." });
  }
});

/**
 * Route: GET /api/storage/recommendations
 * Description: AI provides recommendations for optimizing storage usage.
 */
router.get("/recommendations", authenticate, async (req, res) => {
  const { userId } = req.user;

  try {
    console.log(`🔍 AI generating storage recommendations for user: ${userId}`);
    
    const recommendations = await aiStorageBalancer.recommendStorageActions(userId);

    // Log AI learning event
    await aiLearningManager.logAILearning(userId, "storage_recommendations", recommendations);

    res.status(200).json({ message: "Storage recommendations generated successfully", recommendations });
  } catch (error) {
    console.error("❌ Error generating storage recommendations:", error.message);
    res.status(500).json({ error: "Failed to generate storage recommendations." });
  }
});

module.exports = router;
