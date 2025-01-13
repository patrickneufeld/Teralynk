// File: /backend/services/accessControlService.js

const { hasPermission } = require('./rbacService');

/**
 * Function to check if a user has access to a specific resource
 * @param {string} userId - The ID of the user
 * @param {string} resource - The resource being accessed
 * @param {string} permission - The required permission for the resource
 * @returns {Promise<boolean>} - True if the user has access, false otherwise
 */
const hasAccess = async (userId, resource, permission) => {
    try {
        if (!userId || !resource || !permission) {
            throw new Error('User ID, resource, and permission are required.');
        }

        // Check if user has the required permission
        const accessGranted = await hasPermission(userId, permission);

        console.log(
            `Access check: User ${userId} ${accessGranted ? 'has' : 'does not have'} access to resource ${resource} with permission ${permission}`
        );

        return accessGranted;
    } catch (error) {
        console.error('Error checking access:', error.message);
        throw new Error('Failed to check access.');
    }
};

module.exports = { hasAccess };
