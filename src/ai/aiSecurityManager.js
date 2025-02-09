// File Path: backend/src/ai/aiSecurityManager.js

/**
 * AI Security Manager
 * Handles AI authentication, access control, and security policies.
 */

const allowedUsers = new Set();

function addUserToAccessList(userId) {
    allowedUsers.add(userId);
}

function removeUserFromAccessList(userId) {
    allowedUsers.delete(userId);
}

function isUserAllowed(userId) {
    return allowedUsers.has(userId);
}

module.exports = { addUserToAccessList, removeUserFromAccessList, isUserAllowed };
