// File: /backend/services/rbacService.js

// In-memory store for roles, permissions, user-role mapping, and group-role mapping (replace with a database for production)
const roles = {
    Admin: ['read', 'write', 'delete', 'share', 'manageUsers'],
    Editor: ['read', 'write', 'share'],
    Viewer: ['read'],
};

const userRoles = {}; // { userId: 'RoleName' }
const groupRoles = {}; // { groupId: 'RoleName' }
const roleAssignmentHistory = []; // Log for auditing role assignments

// Assign a role to a user
const assignRoleToUser = (userId, roleName) => {
    if (!roles[roleName]) {
        throw new Error(`Invalid role: ${roleName}`);
    }

    userRoles[userId] = roleName;
    roleAssignmentHistory.push({ entityId: userId, roleName, type: 'user', timestamp: new Date() });
    console.log(`Role '${roleName}' assigned to user '${userId}'`);
    return { userId, roleName };
};

// Assign a role to a group
const assignRoleToGroup = (groupId, roleName) => {
    if (!roles[roleName]) {
        throw new Error(`Invalid role: ${roleName}`);
    }

    groupRoles[groupId] = roleName;
    roleAssignmentHistory.push({ entityId: groupId, roleName, type: 'group', timestamp: new Date() });
    console.log(`Role '${roleName}' assigned to group '${groupId}'`);
    return { groupId, roleName };
};

// Get the role of a user or group
const getRole = (entityId, type = 'user') => {
    const role = type === 'user' ? userRoles[entityId] : groupRoles[entityId];
    if (!role) {
        throw new Error(`No role assigned to ${type} '${entityId}'`);
    }
    return role;
};

// Check if a user has a specific permission
const hasPermission = (userId, permission) => {
    const role = getRole(userId);
    const permissions = roles[role];

    if (!permissions || !permissions.includes(permission)) {
        return false;
    }

    return true;
};

// Add a new role with permissions
const addRole = (roleName, permissions) => {
    if (roles[roleName]) {
        throw new Error(`Role '${roleName}' already exists.`);
    }

    roles[roleName] = permissions;
    console.log(`Role '${roleName}' added with permissions: ${permissions.join(', ')}`);
    return { roleName, permissions };
};

// Get all roles and their permissions
const getAllRoles = () => {
    return roles;
};

// Get role assignment history
const getRoleAssignmentHistory = () => {
    return roleAssignmentHistory;
};

module.exports = {
    assignRoleToUser,
    assignRoleToGroup,
    getRole,
    hasPermission,
    addRole,
    getAllRoles,
    getRoleAssignmentHistory,
};
