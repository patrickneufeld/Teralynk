
function sanitize(input) {
  return String(input).replace(/[^a-zA-Z0-9@_\-:. ]/g, '').trim();
}


import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/ai/aiSecurityManager.js

import { requireAuth } from "../middleware/authMiddleware.mjs";
import { logSecurityEvent } from "../config/logger.mjs";

// ✅ Set of Allowed Users for Direct Access Control
const allowedUsers = new Set();

/**
 * ✅ Add User to AI Access List
 * @param {string} userId - User ID to grant AI access.
 */
export const addUserToAccessList = (userId) => {
  allowedUsers.add(userId);
};

/**
 * ✅ Remove User from AI Access List
 * @param {string} userId - User ID to revoke AI access.
 */
export const removeUserFromAccessList = (userId) => {
  allowedUsers.delete(userId);
};

/**
 * ✅ Check if a User is Allowed AI Access
 * @param {string} userId - The user's unique ID.
 * @returns {boolean} - True if user is allowed, false otherwise.
 */
export const isUserAllowed = (userId) => {
  return allowedUsers.has(userId);
};

/**
 * ✅ Fetch AI User Permissions (From Cognito or Database)
 * Simulates fetching real-time user permissions.
 * @param {string} userId - The user's unique ID.
 * @returns {Promise<string[]>} - List of allowed AI services.
 */
export const fetchUserPermissions = async (userId) => {
  if (isKillSwitchEnabled()) return;
  try {
    // 🔧 TODO: Replace with actual DB or Cognito integration
    const mockPermissions = {
      "admin": ["text-generation", "image-processing", "data-analysis"],
      "developer": ["text-generation", "data-analysis"],
      "viewer": ["text-generation"],
    };

    return mockPermissions[userId] || [];
  } catch (error) {
    console.error("❌ Error fetching user permissions:", error.message);
    return [];
  }
};

/**
 * ✅ Check AI Query Permissions
 * Ensures users can only access AI functions based on their role.
 * @param {string} userId - The user's unique ID.
 * @param {string} requestedAIService - The AI service they are trying to use.
 * @returns {Promise<boolean>} - True if access is allowed, false otherwise.
 */
export const checkAIAccess = async (userId, requestedAIService) => {
  if (isKillSwitchEnabled()) return;
  try {
    const userPermissions = await fetchUserPermissions(userId);

    if (!userPermissions.includes(requestedAIService)) {
      console.warn(`🚨 Unauthorized AI access attempt by user ${sanitize(userId)} to service: ${requestedAIService}`);
      await logSecurityEvent(userId, "unauthorized_ai_access", { service: requestedAIService });
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Error checking AI permissions:", error.message);
    return false;
  }
};

/**
 * ✅ Middleware: AI Authorization Check
 * Validates whether the user has the right permissions for AI features.
 */
export const aiAuthorizationMiddleware = async (req, res, next) => {
  if (isKillSwitchEnabled()) return;
  try {
    requireAuth(req, res, async () => {
      const { user } = req;
      const { aiService } = req.body;

      if (!await checkAIAccess(user.id, aiService)) {
        return res.status(403).json({ error: "Unauthorized AI service access." });
      }

      next();
    });
  } catch (error) {
    console.error("❌ AI Authorization Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// TODO: Implement rate limiting logic to avoid API abuse (e.g., token bucket or middleware).