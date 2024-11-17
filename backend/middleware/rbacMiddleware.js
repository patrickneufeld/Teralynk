// File: /backend/middleware/rbacMiddleware.js

const { hasPermission, getRole } = require('../services/rbacService');

// Middleware to enforce RBAC
const rbacMiddleware = (requiredPermissions) => {
    return (req, res, next) => {
        try {
            const userId = req.userId; // Assume userId is added to the request object by an authentication middleware
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized: No user ID provided.' });
            }

            const userRole = getRole(userId);
            const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

            // Check if the user has all the required permissions
            const isAuthorized = permissions.every((permission) => hasPermission(userId, permission));
            if (!isAuthorized) {
                return res.status(403).json({
                    error: `Forbidden: Your role '${userRole}' lacks the required permissions: ${permissions.join(', ')}.`,
                });
            }

            next(); // Proceed to the next middleware or route handler
        } catch (error) {
            console.error('RBAC Error:', error);
            res.status(500).json({ error: 'An error occurred while verifying permissions.' });
        }
    };
};

module.exports = rbacMiddleware;
