// File Path: backend/collaboration/permissionsService.js

const sessionPermissions = new Map(); // Temporary in-memory store (replace with a database for production)

/**
 * Assigns a role to a user in a session.
 * @param {string} sessionId - The ID of the session.
 * @param {string} userId - The ID of the user.
 * @param {string} role - The role to assign (e.g., "viewer", "editor", "admin").
 */
const assignRole = (sessionId, userId, role) => {
    if (!sessionId || !userId || !role) {
        throw new Error('Session ID, User ID, and role are required to assign a role.');
    }

    if (!sessionPermissions.has(sessionId)) {
        sessionPermissions.set(sessionId, new Map());
    }

    const permissions = sessionPermissions.get(sessionId);
    permissions.set(userId, role);

    console.log(`Assigned role "${role}" to user ${userId} in session ${sessionId}.`);
};

/**
 * Retrieves the role of a user in a session.
 * @param {string} sessionId - The ID of the session.
 * @param {string} userId - The ID of the user.
 * @returns {string|null} - The role of the user, or null if not assigned.
 */
const getRole = (sessionId, userId) => {
    if (!sessionId || !userId) {
        throw new Error('Session ID and User ID are required to retrieve a role.');
    }

    const permissions = sessionPermissions.get(sessionId);
    const role = permissions ? permissions.get(userId) : null;

    console.log(`Role for user ${userId} in session ${sessionId}: ${role}`);
    return role;
};

/**
 * Checks if a user has a specific role in a session.
 * @param {string} sessionId - The ID of the session.
 * @param {string} userId - The ID of the user.
 * @param {string} requiredRole - The role to check for.
 * @returns {boolean} - Whether the user has the required role.
 */
const hasRole = (sessionId, userId, requiredRole) => {
    const role = getRole(sessionId, userId);
    return role === requiredRole;
};

/**
 * Removes a user from the session permissions.
 * @param {string} sessionId - The ID of the session.
 * @param {string} userId - The ID of the user.
 */
const removeRole = (sessionId, userId) => {
    if (!sessionId || !userId) {
        throw new Error('Session ID and User ID are required to remove a role.');
    }

    const permissions = sessionPermissions.get(sessionId);
    if (permissions) {
        permissions.delete(userId);
        console.log(`Removed role for user ${userId} in session ${sessionId}.`);

        // Clean up if no roles remain in the session
        if (permissions.size === 0) {
            sessionPermissions.delete(sessionId);
            console.log(`Session ${sessionId} removed from permissions.`);
        }
    }
};

/**
 * Clears all roles for a session.
 * @param {string} sessionId - The ID of the session.
 */
const clearSessionRoles = (sessionId) => {
    if (!sessionId) {
        throw new Error('Session ID is required to clear roles.');
    }

    sessionPermissions.delete(sessionId);
    console.log(`Cleared all roles for session ${sessionId}.`);
};

/**
 * Retrieves all roles in a session.
 * @param {string} sessionId - The ID of the session.
 * @returns {object} - A map of user IDs to roles.
 */
const getAllRolesInSession = (sessionId) => {
    if (!sessionId) {
        throw new Error('Session ID is required to retrieve roles.');
    }

    const permissions = sessionPermissions.get(sessionId);
    const roles = permissions ? Object.fromEntries(permissions.entries()) : {};

    console.log(`Roles in session ${sessionId}:`, roles);
    return roles;
};

module.exports = {
    assignRole,
    getRole,
    hasRole,
    removeRole,
    clearSessionRoles,
    getAllRolesInSession,
};
