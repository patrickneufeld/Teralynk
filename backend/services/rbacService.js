// File: /backend/services/rbacService.js

const { getUserFromCognito } = require('./cognitoService'); // Assuming this service fetches user info from Cognito
const { Client } = require('pg');
const dotenv = require('dotenv');

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

// Roles with permissions (could be fetched dynamically from a database or Cognito)
const roles = {
    Admin: {
        description: 'Administrator with full access',
        permissions: ['read', 'write', 'delete', 'share', 'manageUsers'],
    },
    Editor: {
        description: 'Can edit content but not manage users',
        permissions: ['read', 'write', 'share'],
    },
    Viewer: {
        description: 'Can only view content',
        permissions: ['read'],
    },
};

// Assign a role to a user
const assignRoleToUser = async (userId, roleName) => {
    const user = await getUserFromCognito(userId);  // Get user from Cognito (check role assignment)
    if (!user) {
        throw new Error(`User not found in Cognito: ${userId}`);
    }

    // Update the database with the user's role
    try {
        const res = await client.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
            [roleName, userId]
        );
        console.log(`Role '${roleName}' assigned to user '${userId}'`);
        return { userId, roleName };
    } catch (err) {
        console.error('Error assigning role to user', err.stack);
        throw new Error('Failed to assign role to user');
    }
};

// Get the role of a user from the database or Cognito
const getRole = async (userId) => {
    const user = await getUserFromCognito(userId);  // Fetch user data from Cognito

    if (!user) {
        throw new Error(`User not found in Cognito: ${userId}`);
    }

    return user.role;  // Assuming role is stored in Cognito (or retrieved from database)
};

// Check if a user has a specific permission based on their role
const hasPermission = async (userId, permission) => {
    const role = await getRole(userId);
    const permissions = roles[role]?.permissions;

    if (!permissions || !permissions.includes(permission)) {
        return false;
    }

    return true;
};

// Remove a role from a user
const removeRole = async (userId) => {
    const user = await getUserFromCognito(userId);  // Get user from Cognito

    if (!user) {
        throw new Error(`User not found in Cognito: ${userId}`);
    }

    try {
        const res = await client.query(
            'UPDATE users SET role = NULL WHERE id = $1 RETURNING *',
            [userId]
        );
        if (res.rows.length === 0) {
            throw new Error(`No role assigned to user '${userId}'`);
        }
        console.log(`Role removed from user '${userId}'`);
        return { userId, role: null };
    } catch (err) {
        console.error('Error removing role', err.stack);
        throw new Error('Failed to remove role');
    }
};

// Get all roles and their permissions (Could be fetched dynamically from a DB or Cognito)
const getAllRoles = () => {
    return roles;
};

// Get role assignment history from the database
const getRoleAssignmentHistory = async () => {
    try {
        const res = await client.query('SELECT * FROM role_assignment_history');
        return res.rows;
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
