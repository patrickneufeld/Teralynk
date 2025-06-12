// ✅ FILE: /backend/src/services/common/rbacService.js

/**
 * Role-Based Access Control (RBAC) enforcement utilities for Teralynk.
 * Provides functions to check user permissions based on roles, ownership, and feature flags.
 */

import { ForbiddenError } from '../../utils/errors.mjs';
import { auditEvent } from '../../utils/auditLogger.mjs';

const roles = {
  ADMIN: 'admin',
  USER: 'user',
  AI_ENGINE: 'ai_engine',
  AUDITOR: 'auditor',
  SUPER_ADMIN: 'super_admin',
};

/**
 * ✅ Verifies if the user has required role(s).
 */
export function enforceRole(user, allowedRoles) {
  const roleList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!user || !roleList.includes(user.role)) {
    auditEvent({
      eventType: 'RBAC_DENY',
      actor: user?.id,
      action: 'enforceRole',
      traceId: 'no-trace',
      details: { attemptedRoles: roleList },
    });
    throw new ForbiddenError('Insufficient role to perform this action.');
  }
}

/**
 * ✅ Validates if user has access to a resource they own.
 */
export function enforceOwnership(user, ownerId) {
  if (!user || user.id !== ownerId) {
    auditEvent({
      eventType: 'RBAC_DENY_OWNERSHIP',
      actor: user?.id,
      action: 'enforceOwnership',
      traceId: 'no-trace',
      details: { resourceOwner: ownerId },
    });
    throw new ForbiddenError('You do not have ownership access to this resource.');
  }
}

/**
 * ✅ Confirms the user can access a specific feature via roles or feature flags.
 */
export function enforceFeatureAccess(user, feature, enabledRoles = new Set()) {
  if (!user || !enabledRoles.has(user.role)) {
    auditEvent({
      eventType: 'RBAC_FEATURE_DENIED',
      actor: user?.id,
      action: `access:${feature}`,
      traceId: 'no-trace',
    });
    throw new ForbiddenError(`Access to ${feature} is restricted for your role.`);
  }
}

/**
 * ✅ Returns true if user has any of the listed roles.
 */
export function hasRole(user, allowedRoles) {
  return !!user && allowedRoles.includes(user.role);
}

/**
 * ✅ Utility to determine if the user is a privileged admin.
 */
export function isPrivilegedAdmin(user) {
  return user && (user.role === roles.ADMIN || user.role === roles.SUPER_ADMIN);
}

/**
 * ✅ Checks if a user is allowed to access a specific AI provider.
 */
export function hasProviderAccess(user, providerKey) {
  if (!user || !providerKey) return false;
  const permissions = user.permissions || [];
  return permissions.includes(`provider:${providerKey}`) || permissions.includes('provider:*');
}

/**
 * ✅ Explicit Claude access checker based on role
 */
export function hasClaudeAccess(user) {
  return !!user && [roles.AI_ENGINE, roles.ADMIN, roles.SUPER_ADMIN].includes(user.role);
}

export default {
  enforceRole,
  enforceOwnership,
  enforceFeatureAccess,
  isPrivilegedAdmin,
  hasRole,
  hasProviderAccess,
  hasClaudeAccess,
  roles,
};
