// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/securityRoutes.js

const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const aiSecurityManager = require("../ai/aiSecurityManager");
const aiLearningManager = require("../ai/aiLearningManager");

const router = express.Router();

/**
 * Route: POST /api/security/permissions
 * Description: AI assigns and updates user permissions dynamically.
 */
router.post("/permissions", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { targetUserId, fileName, provider, permissionLevel } = req.body;

  if (!targetUserId || !fileName || !permissionLevel) {
    return res.status(400).json({ error: "Target user, file name, and permission level are required." });
  }

  try {
    console.log(`🔐 AI Adjusting Permissions for ${targetUserId} on ${fileName}`);

    // AI assigns or updates permissions based on security rules
    const permissionUpdate = await aiSecurityManager.updatePermissions(userId, targetUserId, fileName, provider, permissionLevel);
    
    // Log AI learning from permission adjustments
    await aiLearningManager.logAILearning(userId, "permission_update", { targetUserId, fileName, provider, permissionLevel });

    res.status(200).json({ message: "Permissions updated successfully", permissionUpdate });
  } catch (error) {
    console.error("Error updating permissions:", error.message);
    res.status(500).json({ error: "Failed to update permissions." });
  }
});

/**
 * Route: GET /api/security/logs
 * Description: AI monitors and logs security events.
 */
router.get("/logs", authenticate, async (req, res) => {
  const { userId } = req.user;

  try {
    console.log(`📊 AI Fetching Security Logs for User: ${userId}`);

    // AI retrieves and analyzes security logs
    const securityLogs = await aiSecurityManager.getSecurityLogs(userId);

    res.status(200).json({ message: "Security logs retrieved", securityLogs });
  } catch (error) {
    console.error("Error retrieving security logs:", error.message);
    res.status(500).json({ error: "Failed to retrieve security logs." });
  }
});

/**
 * Route: POST /api/security/detect-threats
 * Description: AI detects unauthorized access attempts.
 */
router.post("/detect-threats", authenticate, async (req, res) => {
  const { userId } = req.user;

  try {
    console.log(`🚨 AI Scanning for Security Threats for User: ${userId}`);

    // AI detects suspicious activity and provides recommendations
    const threatDetection = await aiSecurityManager.detectSecurityThreats(userId);
    
    // Log AI learning from security events
    await aiLearningManager.logAILearning(userId, "security_threat_detection", { userId, threatDetection });

    res.status(200).json({ message: "Security threat scan completed", threatDetection });
  } catch (error) {
    console.error("Error detecting security threats:", error.message);
    res.status(500).json({ error: "Failed to detect security threats." });
  }
});

/**
 * Route: POST /api/security/block-user
 * Description: AI automatically blocks a user if they attempt unauthorized access.
 */
router.post("/block-user", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { targetUserId, reason } = req.body;

  if (!targetUserId || !reason) {
    return res.status(400).json({ error: "Target user ID and reason are required." });
  }

  try {
    console.log(`⛔ AI Blocking User: ${targetUserId}`);

    // AI enforces security by blocking a user from unauthorized access
    const blockResult = await aiSecurityManager.blockUser(userId, targetUserId, reason);
    
    // Log AI learning from security enforcement
    await aiLearningManager.logAILearning(userId, "user_blocked", { targetUserId, reason });

    res.status(200).json({ message: "User blocked successfully", blockResult });
  } catch (error) {
    console.error("Error blocking user:", error.message);
    res.status(500).json({ error: "Failed to block user." });
  }
});

module.exports = router;
