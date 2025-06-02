// File: /frontend/src/utils/securityContext.js

import { getCurrentUser } from './authUtils';
import { getSessionMetadata } from './sessionManager';
import { getFingerprint } from './tokenManager';
import { createLogger } from './logger';

const logger = createLogger('securityContext');

/**
 * Generate a secure, session-aware security context object.
 * This includes traceability, identity, RBAC level, device metadata, and trust score.
 */
export async function generateSecurityContext() {
  try {
    const user = await getCurrentUser();
    const session = await getSessionMetadata();
    const fingerprint = await getFingerprint();

    if (!user || !session) {
      throw new Error('Missing user or session information for security context.');
    }

    return {
      traceId: session.traceId || crypto.randomUUID(),
      userId: user.id,
      username: user.username || user.email,
      rbacLevel: user.role || 'viewer',
      deviceFingerprint: fingerprint,
      deviceTrustScore: session.trustScore || 0,
      sessionTimestamp: session.timestamp || Date.now(),
      tenantId: user.tenantId || null,
      impersonatedBy: session.impersonatedBy || null,
    };
  } catch (error) {
    logger.error('Failed to generate security context', {
      error,
      critical: true,
    });
    return {
      traceId: crypto.randomUUID(),
      userId: 'anonymous',
      rbacLevel: 'unauthenticated',
      deviceFingerprint: 'unknown',
      deviceTrustScore: 0,
      sessionTimestamp: Date.now(),
    };
  }
}

/**
 * Checks whether the current user is impersonating another user
 */
export async function isImpersonating() {
  const session = await getSessionMetadata();
  return !!session?.impersonatedBy;
}

/**
 * Injects security context into an outgoing API request payload
 * @param {object} payload - the API payload to decorate
 * @returns {Promise<object>}
 */
export async function attachSecurityContext(payload = {}) {
  const context = await generateSecurityContext();
  return {
    ...payload,
    __securityContext: context,
  };
}
