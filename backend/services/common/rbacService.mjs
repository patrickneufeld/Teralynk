// File: /backend/services/rbacService.js

const { createClient } = require('redis');
const { getUserFromCognito } = require('./cognitoService');
const { query } = require('../db');
const { recordActivity } = require('../activityLogService');
require('dotenv').config();

// Redis Client Initialization
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (error) => {
    console.error('Redis client error:', error);
});

(async () => {
    try {
        await redisClient.connect();
        console.log('Connected to Redis');
    } catch (error) {
        console.error('Error connecting to Redis:', error);
        process.exit(1);
    }
})();

// **Assign a role to a user**
const assignRoleToUser = async (userId, roleName) => {
    if (!userId || !roleName) throw new Error('User ID and role name are required.');

    try {
        const user = await getUserFromCognito(userId);
        if (!user) throw new Error(`User not found in Cognito: ${userId}`);

        const roleResult = await query('SELECT * FROM roles WHERE role_name = $1', [roleName]);
        if (roleResult.rows.length === 0) throw new Error(`Role '${roleName}' does not exist.`);

        await query('UPDATE users SET role = $1 WHERE id = $2', [roleName, userId]);
        await redisClient.set(`userRole:${userId}`, roleName);

        await recordActivity(userId, 'assignRole', null, { roleName });
        console.log(`Assigned role '${roleName}' to user '${userId}'`);
        return { userId, roleName };
    } catch (error) {
        console.error('Error assigning role:', error.stack);
        throw new Error('Failed to assign role to user');
    }
};

// **Get the role of a user**
const getRole = async (userId) => {
    if (!userId) throw new Error('User ID is required.');

    try {
        const cachedRole = await redisClient.get(`userRole:${userId}`);
        if (cachedRole) return cachedRole;

        const user = await getUserFromCognito(userId);
        if (!user) throw new Error(`User not found in Cognito: ${userId}`);

        const result = await query('SELECT role FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) throw new Error(`No role found for user ${userId}`);

        const role = result.rows[0].role;
        await redisClient.set(`userRole:${userId}`, role);

        return role;
    } catch (error) {
        console.error('Error retrieving role:', error.stack);
        throw new Error('Failed to retrieve user role');
    }
};

// **Check if a user has a specific permission**
const hasPermission = async (userId, permission) => {
    if (!userId || !permission) throw new Error('User ID and permission are required.');

    try {
        const role = await getRole(userId);

        const permissionsResult = await query('SELECT permissions FROM roles WHERE role_name = $1', [role]);
        if (permissionsResult.rows.length === 0) throw new Error(`Permissions not found for role '${role}'`);

        const permissions = permissionsResult.rows[0].permissions;
        return permissions.includes(permission);
    } catch (error) {
        console.error('Error checking permission:', error.stack);
        throw new Error('Failed to check permissions');
    }
};

// **Remove a role from a user**
const removeRole = async (userId) => {
    if (!userId) throw new Error('User ID is required.');

    try {
        const user = await getUserFromCognito(userId);
        if (!user) throw new Error(`User not found in Cognito: ${userId}`);

        await query('UPDATE users SET role = NULL WHERE id = $1', [userId]);
        await redisClient.del(`userRole:${userId}`);

        await recordActivity(userId, 'removeRole', null, { message: `Role removed from user ${userId}` });
        console.log(`Role removed from user '${userId}'`);
        return { userId, role: null };
    } catch (error) {
        console.error('Error removing role:', error.stack);
        throw new Error('Failed to remove role');
    }
};

// **Get all roles and permissions**
const getAllRoles = async () => {
    try {
        const result = await query('SELECT * FROM roles');
        return result.rows;
    } catch (error) {
        console.error('Error retrieving all roles:', error.stack);
        throw new Error('Failed to retrieve all roles');
    }
};

// **Get role assignment history**
const getRoleAssignmentHistory = async () => {
    try {
        const result = await query('SELECT * FROM role_assignment_history');
        return result.rows;
    } catch (error) {
        console.error('Error retrieving role assignment history:', error.stack);
        throw new Error('Failed to retrieve role assignment history');
    }
};

// **Assign permissions to a role**
const assignPermissionsToRole = async (roleName, permissions) => {
    if (!roleName || !Array.isArray(permissions)) throw new Error('Role name and permissions array are required.');

    try {
        await query(
            'UPDATE roles SET permissions = $1 WHERE role_name = $2',
            [permissions, roleName]
        );

        console.log(`Permissions updated for role '${roleName}':`, permissions);
        return { roleName, permissions };
    } catch (error) {
        console.error('Error updating role permissions:', error.stack);
        throw new Error('Failed to update role permissions');
    }
};

module.exports = {
    assignRoleToUser,
    getRole,
    hasPermission,
    removeRole,
    getAllRoles,
    getRoleAssignmentHistory,
    assignPermissionsToRole,
};
