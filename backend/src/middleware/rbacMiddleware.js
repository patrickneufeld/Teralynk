// File Path: backend/middleware/rbacMiddleware.js

const { hasPermission, getRole } = require('../services/rbacService');
const { logAuditEvent } = require('../services/auditLogService');

/**
 * Middleware to enforce Role-Based Access Control (RBAC)
 */
const rbacMiddleware = (requiredPermissions = [], allowedRoles = []) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            const userRole = req.user?.role;

            if (!userId || !userRole) {
                logAuditEvent('MISSING_USER_DATA', { userId: null, route: req.originalUrl });
                return res.status(401).json({ error: 'Unauthorized: User ID or role missing.' });
            }

            if (userRole.toLowerCase() === 'admin') {
                return next();
            }

            if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
                logAuditEvent('ACCESS_DENIED', { userId, role: userRole, route: req.originalUrl });
                return res.status(403).json({ error: `Role '${userRole}' not authorized for this route.` });
            }

            const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
            const permissionResults = await Promise.all(
                permissions.map((permission) => hasPermission(userId, permission))
            );

            const missingPermissions = permissions.filter((_, index) => !permissionResults[index]);

            if (missingPermissions.length > 0) {
                logAuditEvent('ACCESS_DENIED', {
                    userId,
                    role: userRole,
                    route: req.originalUrl,
                    missingPermissions,
                });
                return res.status(403).json({ error: `Missing permissions: ${missingPermissions.join(', ')}` });
            }

            next();
        } catch (error) {
            console.error('RBAC Middleware Error:', error);
            next(error);
        }
    };
};

module.exports = rbacMiddleware;
