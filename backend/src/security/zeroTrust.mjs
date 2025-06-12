// ✅ FILE: /backend/src/security/zeroTrust.js

import crypto from 'crypto';
import { getCurrentUserContext } from '../utils/securityContext.mjs';
import { logSecurityEvent } from '../utils/logger.mjs';
import { UnauthorizedAccessError } from '../errors/DatabaseError.mjs';

const TRUSTED_DEVICES_KEY = 'x-trusted-device';

/**
 * ZeroTrustManager
 * Provides static methods for validating trust context, device validation, and policy enforcement.
 */
export class ZeroTrustManager {
  /**
   * Validates Zero Trust context: device, session, and telemetry integrity
   * @param {object} req - Express request
   * @param {object} session - User session object
   * @returns {boolean} - true if passes validation, throws if not
   */
  static validateSessionContext(req, session) {
    const context = getCurrentUserContext(req);

    if (!context || !session) {
      logSecurityEvent('zero-trust-failure', {
        reason: 'Missing session or context',
        traceId: req.traceId,
      });
      throw new UnauthorizedAccessError('Zero Trust validation failed: No session context');
    }

    const { deviceFingerprint, ip, userAgent } = context;

    if (!deviceFingerprint || !ip || !userAgent) {
      logSecurityEvent('zero-trust-failure', {
        reason: 'Missing fingerprint or IP/UA data',
        traceId: req.traceId,
      });
      throw new UnauthorizedAccessError('Incomplete Zero Trust context');
    }

    if (!this.isTrustedDevice(req)) {
      logSecurityEvent('zero-trust-warning', {
        reason: 'Untrusted device',
        userId: session.userId,
        traceId: req.traceId,
        deviceFingerprint,
      });
      throw new UnauthorizedAccessError('Device not trusted under Zero Trust policy');
    }

    return true;
  }

  /**
   * Checks if request comes from a trusted device.
   * @param {object} req - Express request
   * @returns {boolean}
   */
  static isTrustedDevice(req) {
    const headerValue = req.headers[TRUSTED_DEVICES_KEY];
    if (!headerValue) return false;

    try {
      const decoded = Buffer.from(headerValue, 'base64').toString('utf-8');
      const [deviceId, signature] = decoded.split(':');
      const expectedSig = crypto
        .createHash('sha256')
        .update(deviceId + process.env.DEVICE_SECRET)
        .digest('hex');

      return signature === expectedSig;
    } catch (err) {
      logSecurityEvent('trusted-device-parse-failure', {
        error: err.message,
        traceId: req.traceId,
      });
      return false;
    }
  }

  /**
   * Enforces a specific named trust policy
   * @param {string} policyName
   * @param {object} context - Session context object
   * @returns {boolean}
   */
  static enforcePolicy(policyName, context) {
    switch (policyName) {
      case 'require_fingerprint':
        return Boolean(context?.deviceFingerprint);
      case 'require_mfa':
        return context?.mfaVerified === true;
      default:
        return true; // permissive fallback
    }
  }

  /**
   * Generates a trust signature for device authentication
   * @param {string} deviceId
   * @returns {string} - Base64 encoded trust signature
   */
  static generateTrustedDeviceSignature(deviceId) {
    if (!deviceId || !process.env.DEVICE_SECRET) {
      throw new Error('Missing device ID or DEVICE_SECRET');
    }

    const signature = crypto
      .createHash('sha256')
      .update(deviceId + process.env.DEVICE_SECRET)
      .digest('hex');

    return Buffer.from(`${deviceId}:${signature}`).toString('base64');
  }
}
