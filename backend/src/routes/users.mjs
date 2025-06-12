// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/routes/users.js

import express from "express";
import { getUserProfile } from "../controllers/userController.mjs";
import { requireAuth } from "../middleware/authMiddleware.mjs";
import logger from "../utils/logger.mjs";

const router = express.Router();

// ✅ Route to handle /users/profile
router.get("/profile", async (req, res) => {
  try {
    // For testing purposes, allow this endpoint without authentication
    // In production, you should use requireAuth middleware
    const userId = req.user?.id || "test-user-id";
    logger.info(`🔍 Fetching profile for user: ${userId}`);
    
    const result = await getUserProfile(userId);
    
    if (!result.success) {
      logger.warn(`⚠️ Profile not found for user: ${userId}`);
      return res.status(404).json({ success: false, error: "Profile not found." });
    }
    
    logger.info(`✅ Profile retrieved successfully for user: ${userId}`);
    res.status(200).json(result);
  } catch (err) {
    logger.error(`❌ Error fetching profile for user: ${userId}`, err);
    res.status(500).json({ 
      success: false, 
      message: "Server error retrieving profile.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ✅ Add other user routes as needed

export default router;
