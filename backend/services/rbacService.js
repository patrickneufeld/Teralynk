const { getUserFromCognito } = require('./cognitoService');
const { Client } = require('pg');
const dotenv = require('dotenv');
const Redis = require('redis');

// Load environment variables from .env file
dotenv.config();

// Initialize PostgreSQL client
const client = new Client({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT || 5432,
});

// Connect to PostgreSQL
client.connect().catch((error) => {
    console.error('Error connecting to the database', error.stack);
});

// Initialize Redis for caching user roles
const redisClient = Redis.createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch((error) => {
    console.error('Error connecting to Redis', error.stack);
});

// Assign a role to a user
const assignRoleToUser = async (userId, roleName) => {
    try {
        const user = await getUserFromCognito(userId);
        if (!user) {
            throw new Error(`User not found in Cognito: ${userId}`);
        }

        // Check if the role exists in the database
        const roleResult = await client.query('SELECT * FROM roles WHERE role_name = $1', [roleName]);
        if (roleResult.rows.length === 0) {
            throw new Error(`Role '${roleName}' does not exist.`);
        }

        // Assign the role to the user in the database
        await client.query('UPDATE users SET role = $1 WHERE id = $2', [roleName, userId]);

        // Cache the role in Redis for fast retrieval
        await redisClient.set(`userRole:${userId}`, roleName);

        // Log activity
        await recordActivity(userId, 'assignRoleToUser', null, { roleName });

        console.log(`Role '${roleName}' assigned to user '${userId}'`);
        return { userId, roleName };
    } catch (err) {
        console.error('Error assigning role to user', err.stack);
        throw new Error('Failed to assign role to user');
    }
};

// Get the role of a user
const getRole = async (userId) => {
    try {
        // Check the Redis cache first
        const cachedRole = await redisClient.get(`userRole:${userId}`);
        if (cachedRole) {
            return cachedRole; // Return cached role if found
        }

        // Fetch role from database if not in cache
        const user = await getUserFromCognito(userId);
        if (!user) {
            throw new Error(`User not found in Cognito: ${userId}`);
        }

        const result = await client.query('SELECT role FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            throw new Error(`Role not found for user ${userId}`);
        }

        // Cache the retrieved role for future requests
        await redisClient.set(`userRole:${userId}`, result.rows[0].role);

        return result.rows[0].role;
    } catch (err) {
        console.error('Error retrieving user role', err.stack);
        throw new Error('Failed to retrieve user role');
    }
};

// Check if a user has a specific permission based on their role
const hasPermission = async (userId, permission) => {
    try {
        const role = await getRole(userId);

        // Fetch permissions for the role from the database
        const permissionsResult = await client.query(
            'SELECT permissions FROM roles WHERE role_name = $1',
            [role]
        );
        if (permissionsResult.rows.length === 0) {
            throw new Error(`Permissions not found for role ${role}`);
        }

        const permissions = permissionsResult.rows[0].permissions;

        return permissions.includes(permission);
    } catch (err) {
        console.error('Error checking permissions', err.stack);
        throw new Error('Failed to check permissions');
    }
};

// Remove a role from a user
const removeRole = async (userId) => {
    try {
        const user = await getUserFromCognito(userId);
        if (!user) {
            throw new Error(`User not found in Cognito: ${userId}`);
        }

        // Remove the role from the user in the database
        await client.query('UPDATE users SET role = NULL WHERE id = $1', [userId]);

        // Clear the cached role in Redis
        await redisClient.del(`userRole:${userId}`);

        // Log activity
        await recordActivity(userId, 'removeRole', null, { message: `Role removed from user ${userId}` });

        console.log(`Role removed from user '${userId}'`);
        return { userId, role: null };
    } catch (err) {
        console.error('Error removing role from user', err.stack);
        throw new Error('Failed to remove role from user');
    }
};

// Get all roles and their permissions
const getAllRoles = async () => {
    try {
        const result = await client.query('SELECT * FROM roles');
        return result.rows;
    } catch (err) {
        console.error('Error retrieving all roles', err.stack);
        throw new Error('Failed to retrieve all roles');
    }
};

// Get role assignment history from the database
const getRoleAssignmentHistory = async () => {
    try {
        const result = await client.query('SELECT * FROM role_assignment_history');
        return result.rows;
    } catch (err) {
        console.error('Error retrieving role assignment history', err.stack);
        throw new Error('Failed to retrieve role assignment history');
    }
};

module.exports = {
    assignRoleToUser,
    getRole,
    hasPermission,
    removeRole,
    getAllRoles,
    getRoleAssignmentHistory,
};
