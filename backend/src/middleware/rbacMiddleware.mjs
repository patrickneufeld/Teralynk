// ================================================
// File: /backend/src/middleware/rbacMiddleware.mjs
// ================================================

import { hasPermission, getUserRole } from "../services/rbacService.mjs";
import { logAuditEvent } from "../services/auditLogService.mjs";
import { recordEventTelemetry } from "../ai/aiTelemetryService.mjs";

/**
 * ✅ Generates a trace ID with fallback to header or timestamp.
 * @param {object} req - Express request object
 * @returns {string} traceId
 */
const generateTraceId = (req) => {
  return req.headers["x-trace-id"] || `trace-${Date.now()}`;
};

/**
 * ✅ Middleware to Enforce Role-Based Access Control (RBAC)
 * @param {string[]} requiredPermissions - List of required permissions.
 * @param {string[]} allowedRoles - List of roles explicitly allowed (optional).
 */
export const rbacMiddleware = (requiredPermissions = [], allowedRoles = []) => {
  return async (req, res, next) => {
    const traceId = generateTraceId(req);
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      logAuditEvent("RBAC_MISSING_USER_INFO", { userId: null, route: req.originalUrl, traceId });
      return res.status(401).json({ error: "Unauthorized: Missing user information." });
    }

    // ✅ Admin Bypass
    if (userRole.toLowerCase() === "admin") {
      return next();
    }

    // ✅ Role Check
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      logAuditEvent("RBAC_ROLE_DENIED", { userId, userRole, route: req.originalUrl, traceId });
      await recordEventTelemetry("rbac_role_rejected", { userId, userRole, allowedRoles, traceId });
      return res.status(403).json({ error: `Access denied. Required roles: ${allowedRoles.join(", ")}` });
    }

    // ✅ Permissions Check
    if (requiredPermissions.length > 0) {
      const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
      const results = await Promise.all(permissions.map((p) => hasPermission(userId, p)));
      const denied = permissions.filter((_, i) => !results[i]);

      if (denied.length > 0) {
        logAuditEvent("RBAC_PERMISSION_DENIED", { userId, userRole, denied, traceId, route: req.originalUrl });
        await recordEventTelemetry("rbac_permission_rejected", { userId, denied, traceId });
        return res.status(403).json({ error: `Missing permissions: ${denied.join(", ")}` });
      }
    }

    return next();
  };
};

/**
 * ✅ Middleware to Require a Specific Role
 * @param {string} role - Required user role
 */
export const requireRole = (role) => {
  return (req, res, next) => {
    const { id, role: userRole } = req.user || {};
    if (userRole === role) return next();

    const traceId = generateTraceId(req);
    logAuditEvent("RBAC_ROLE_FORBIDDEN", {
      userId: id,
      expectedRole: role,
      actualRole: userRole,
      route: req.originalUrl,
      traceId,
    });
    return res.status(403).json({ error: `Access forbidden. Required role: ${role}` });
  };
};

/**
 * ✅ Enforce AI provider access (Claude/OpenAI/Bedrock)
 */
export const enforceProviderAccess = (provider) => {
  return async (req, res, next) => {
    const userId = req.user?.id;
    const traceId = generateTraceId(req);
    const permission = `use_${provider.toLowerCase()}`;

    const allowed = await hasPermission(userId, permission);
    if (!allowed) {
      logAuditEvent("AI_PROVIDER_BLOCKED", { userId, provider, traceId });
      return res.status(403).json({ error: `Access denied: You do not have permission to use ${provider}` });
    }

    return next();
  };
};

/**
 * ✅ Middleware to enforce that the user owns the resource
 * @param {string} field - Request field that contains the userId (default = 'userId')
 */
export const enforceSelfOwnership = (field = "userId") => {
  return (req, res, next) => {
    const actingUser = req.user?.id;
    const resourceOwner = req.body?.[field] || req.params?.[field] || req.query?.[field];
    const traceId = generateTraceId(req);

    if (actingUser !== resourceOwner) {
      logAuditEvent("SELF_OWNERSHIP_DENIED", {
        userId: actingUser,
        expected: resourceOwner,
        route: req.originalUrl,
        traceId,
      });
      return res.status(403).json({ error: "Access denied: You do not own this resource." });
    }

    return next();
  };
};
