// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/middleware/rbacMiddleware.js

import { hasPermission, getRole } from "../services/rbacService.js";
import { logAuditEvent } from "../services/auditLogService.js";

/**
 * ✅ Middleware to Enforce Role-Based Access Control (RBAC)
 * @param {string[]} requiredPermissions - List of required permissions for the route.
 * @param {string[]} allowedRoles - List of roles explicitly allowed.
 */
export const rbacMiddleware = (requiredPermissions = [], allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        logAuditEvent("MISSING_USER_DATA", { userId: null, route: req.originalUrl });
        return res.status(401).json({ error: "Unauthorized: User ID or role missing." });
      }

      // ✅ Admins Automatically Bypass RBAC
      if (userRole.toLowerCase() === "admin") {
        return next();
      }

      // ✅ Role-Based Access Check
      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        logAuditEvent("ACCESS_DENIED", { userId, role: userRole, route: req.originalUrl });
        return res.status(403).json({ error: `Role '${userRole}' not authorized for this route.` });
      }

      // ✅ Permission-Based Access Check
      const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
      const permissionResults = await Promise.all(
        permissions.map((permission) => hasPermission(userId, permission))
      );

      const missingPermissions = permissions.filter((_, index) => !permissionResults[index]);

      if (missingPermissions.length > 0) {
        logAuditEvent("ACCESS_DENIED", {
          userId,
          role: userRole,
          route: req.originalUrl,
          missingPermissions,
        });
        return res.status(403).json({ error: `Missing permissions: ${missingPermissions.join(", ")}` });
      }

      next();
    } catch (error) {
      console.error("❌ RBAC Middleware Error:", error);
      next(error);
    }
  };
};

/**
 * ✅ Require a Specific Role for Route Access
 * @param {string} role - The required role (e.g., "admin", "editor", "viewer").
 */
export const requireRole = (role) => {
  return (req, res, next) => {
    if (req.user && req.user.role === role) {
      return next();
    }
    return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
  };
};
