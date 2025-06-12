const permissions = new Map(); // In-memory permissions store (use DB for production)

/**
 * Assign permission to a user for a specific file.
 * @param {string} userId - The ID of the user.
 * @param {string} fileId - The ID of the file.
 * @param {string} permission - The permission to assign (e.g., "read", "write").
 */
const assignPermission = (userId, fileId, permission) => {
    if (!permissions.has(userId)) {
        permissions.set(userId, {});
    }
    const userPermissions = permissions.get(userId);
    userPermissions[fileId] = permission;

    return { userId, fileId, permission };
};

/**
 * Get permissions for a user.
 * @param {string} userId - The ID of the user.
 */
const getPermissions = (userId) => {
    return permissions.get(userId) || {};
};

module.exports = {
    assignPermission,
    getPermissions,
};
