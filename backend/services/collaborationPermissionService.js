// File Path: backend/services/collaborationPermissionService.js

const sessionPermissions = new Map();

/**
 * Assigns a permission to a user in a session.
 * @param {string} sessionId - The ID of the session.
 * @param {string} userId - The ID of the user.
 * @param {string} permission - The permission to assign (e.g., 'edit', 'view').
 */
const assignPermission = (sessionId, userId, permission) => {
    if (!sessionId || !userId || !permission) {
        throw new Error('Session ID, User ID, and permission are required.');
    }

    if (!sessionPermissions.has(sessionId)) {
        sessionPermissions.set(sessionId, new Map());
    }

    const sessionPermissionsData = sessionPermissions.get(sessionId);
    if (!sessionPermissionsData.has(userId)) {
        sessionPermissionsData.set(userId, new Set());
    }

    sessionPermissionsData.get(userId).add(permission);
    console.log(`Assigned permission ${permission} to user ${userId} in session ${sessionId}.`);
};

/**
 * Removes a permission from a user in a session.
 * @param {string} sessionId - The ID of the session.
 * @param {string} userId - The ID of the user.
 * @param {string} permission - The permission to remove.
 */
const removePermission = (sessionId, userId, permission) => {
    if (!sessionId || !userId || !permission) {
        throw new Error('Session ID, User ID, and permission are required.');
    }

    const sessionPermissionsData = sessionPermissions.get(sessionId);
    if (!sessionPermissionsData || !sessionPermissionsData.has(userId)) {
        throw new Error('User not found in the session.');
    }

    sessionPermissionsData.get(userId).delete(permission);
    console.log(`Removed permission ${permission} from user ${userId} in session ${sessionId}.`);
};

/**
 * Checks if a user has a specific permission in a session.
 * @param {string} sessionId - The ID of the session.
 * @param {string} userId - The ID of the user.
 * @param {string} permission - The permission to check.
 * @returns {boolean} - True if the user has the permission, false otherwise.
 */
const hasPermission = (sessionId, userId, permission) => {
    if (!sessionId || !userId || !permission) {
        throw new Error('Session ID, User ID, and permission are required.');
    }

    const sessionPermissionsData = sessionPermissions.get(sessionId);
    if (!sessionPermissionsData || !sessionPermissionsData.has(userId)) {
        return false;
    }

    return sessionPermissionsData.get(userId).has(permission);
};

/**
 * Retrieves all permissions for a user in a session.
 * @param {string} sessionId - The ID of the session.
 * @param {string} userId - The ID of the user.
 * @returns {Set<string>} - A set of permissions the user has in the session.
 */
const getPermissions = (sessionId, userId) => {
    if (!sessionId || !userId) {
        throw new Error('Session ID and User ID are required.');
    }

    const sessionPermissionsData = sessionPermissions.get(sessionId);
    if (!sessionPermissionsData || !sessionPermissionsData.has(userId)) {
        throw new Error('User not found in the session.');
    }

    return sessionPermissionsData.get(userId);
};

/**
 * Removes all permissions from a user in a session.
 * @param {string} sessionId - The ID of the session.
 * @param {string} userId - The ID of the user.
 */
const removeAllPermissions = (sessionId, userId) => {
    if (!sessionId || !userId) {
        throw new Error('Session ID and User ID are required.');
    }

    const sessionPermissionsData = sessionPermissions.get(sessionId);
    if (!sessionPermissionsData || !sessionPermissionsData.has(userId)) {
        throw new Error('User not found in the session.');
    }

    sessionPermissionsData.delete(userId);
    console.log(`Removed all permissions for user ${userId} in session ${sessionId}.`);
};

module.exports = {
    assignPermission,
    removePermission,
    hasPermission,
    getPermissions,
    removeAllPermissions,
};
