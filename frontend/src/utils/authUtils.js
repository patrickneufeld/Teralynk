// ✅ FILE: /frontend/src/utils/authUtils.js

// Types and Imports
/**
 * @typedef {Object} SecurityContext
 * @property {string} clientId
 * @property {string} deviceFingerprint
 * @property {string} deviceId
 * @property {string} sessionId
 * @property {number} securityLevel
 * @property {boolean} mfaVerified
 * @property {number} failedAttempts
 * @property {number|null} lastFailedAttempt
 * @property {number} created
 * @property {number} lastUpdated
 * @property {number} lastUserCheck
 * @property {number} lastTokenRefresh
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string[]} roles
 * @property {number} exp
 * @property {number} authLevel
 * @property {string} sessionId
 * @property {string} deviceId
 */

import { secureStorage } from './security/secureStorage';
import { IdleMonitor } from './security/idleMonitor';
import { MFAService } from '../services/mfaService';
import { AUTH_ACTIONS } from '../reducers/authReducer';
import { SecurityError } from './errors.js';
import { securityEvents } from './security/eventEmitter';
import { logError, logInfo } from './logger';
import tokenManager from './tokenManager';

// Constants & Configuration
const SECURITY_LEVELS = {
  STANDARD: 1,
  ELEVATED: 2,
  CRITICAL: 3
};

const SECURITY_CONFIG = {
  mfa: {
    requiredLevel: SECURITY_LEVELS.ELEVATED,
    allowedMethods: ['totp', 'sms', 'email'],
    codeLength: 6,
    codeExpiry: 300,
    maxAttempts: 3,
    cooldownPeriod: 300
  },
  idle: {
    checkInterval: 300000,
    warningThreshold: 240000,
    maxIdleTime: 900000
  },
  token: {
    refreshThreshold: 300,
    maxRefreshAttempts: 3
  },
  security: {
    fingerprintTimeout: 3600000,
    contextTimeout: 86400000,
    maxFailedAttempts: 5,
    lockoutDuration: 900000
  }
};

const STORAGE_KEYS = {
  SECURITY_CONTEXT: 'security_ctx',
  SESSION_ID: 'session_id',
  DEVICE_ID: 'device_id',
  MFA_STATE: 'mfa_state',
  AUTH_STATE: 'auth_state'
};

const SECURITY_EVENTS = {
  CONTEXT_INITIALIZED: 'security-context-initialized',
  MFA_INITIATED: 'mfa-initiated',
  MFA_VERIFIED: 'mfa-verified',
  IDLE_WARNING: 'idle-warning',
  VALIDATION_FAILED: 'security-validation-failed',
  TOKEN_REFRESH: 'token-refresh',
  SESSION_EXPIRED: 'session-expired'
};



const idleMonitor = new IdleMonitor({
  idleTime: SECURITY_CONFIG.idle.maxIdleTime,
  pollInterval: SECURITY_CONFIG.idle.checkInterval,
  warningThreshold: SECURITY_CONFIG.idle.warningThreshold
});

// Core Functions and Exports
export const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch (error) {
    logError('Token decode failed', { error });
    return null;
  }
};

export const validateTokenClaims = (token) => {
  try {
    const claims = decodeToken(token);
    const requiredClaims = ['sub', 'exp', 'email', 'iat'];
    const hasAllClaims = requiredClaims.every(claim => claim in claims);
    const notExpired = claims.exp * 1000 > Date.now();
    const validIssueTime = claims.iat * 1000 <= Date.now();

    return hasAllClaims && notExpired && validIssueTime;
  } catch (error) {
    logError('Token claims validation failed', { error });
    return false;
  }
};

export const calculateAuthLevel = (claims) => {
  try {
    const roles = claims?.['custom:roles'] || [];
    if (roles.includes('super_admin')) return SECURITY_LEVELS.CRITICAL;
    if (roles.includes('admin')) return SECURITY_LEVELS.ELEVATED;
    return SECURITY_LEVELS.STANDARD;
  } catch (error) {
    logError('Auth level calculation failed', { error });
    return SECURITY_LEVELS.STANDARD;
  }
};

export const getDeviceFingerprint = async () => {
  try {
    const components = [
      navigator.userAgent,
      screen.width,
      screen.height,
      navigator.language,
      navigator.hardwareConcurrency || '',
      navigator.deviceMemory || '',
      new Date().getTimezoneOffset(),
      navigator.platform,
      navigator.vendor,
      (await navigator.mediaDevices?.enumerateDevices())?.length
    ].filter(Boolean);

    const fingerprint = components.join('|');
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    logError('Device fingerprint generation failed', { error });
    return crypto.randomUUID();
  }
};

export const getDeviceId = async () => {
  try {
    let deviceId = await secureStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) {
      deviceId = `device_${await getDeviceFingerprint()}`;
      await secureStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId, { encrypt: true });
      logInfo('New device ID created', { deviceId });
    }
    return deviceId;
  } catch (error) {
    logError('Device ID management failed', { error });
    return 'unknown_device';
  }
};

// Export getClientId as a named export that uses getDeviceId
export const getClientId = getDeviceId;
export const getSessionId = async () => {
  try {
    let sessionId = await secureStorage.getItem(STORAGE_KEYS.SESSION_ID);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${crypto.randomUUID()}`;
      await secureStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId, { encrypt: true });
      logInfo('New session created', { sessionId });
    }
    return sessionId;
  } catch (error) {
    logError('Session ID management failed', { error });
    return crypto.randomUUID();
  }
};

export const getCurrentUser = async () => {
  try {
    const token = await tokenManager.getToken();
    if (!token) return null;

    const payload = decodeToken(token);
    if (!payload) return null;

    const user = {
      id: payload.sub,
      email: payload.email,
      roles: payload['custom:roles'] || [],
      exp: payload.exp,
      authLevel: calculateAuthLevel(payload),
      sessionId: await getSessionId(),
      deviceId: await getDeviceId()
    };

    await updateSecurityContext({ lastUserCheck: Date.now() });
    return user;
  } catch (error) {
    logError('Get current user failed', { error });
    return null;
  }
};

// Private Helper Functions
const validateToken = async (token) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded) return false;

    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();
    if (expirationTime <= currentTime) return false;

    const issueTime = decoded.iat * 1000;
    if (issueTime > currentTime) return false;

    if (!validateTokenClaims(token)) return false;

    return true;
  } catch (error) {
    logError('Token validation failed', { error });
    return false;
  }
};

const validateSession = async (context) => {
  try {
    if (!context) return false;

    const currentTime = Date.now();
    const sessionAge = currentTime - context.created;
    const lastUpdateAge = currentTime - context.lastUpdated;

    if (sessionAge > SECURITY_CONFIG.security.contextTimeout) return false;
    if (lastUpdateAge > SECURITY_CONFIG.security.fingerprintTimeout) return false;

    const currentFingerprint = await getDeviceFingerprint();
    if (currentFingerprint !== context.deviceFingerprint) return false;

    return true;
  } catch (error) {
    logError('Session validation failed', { error });
    return false;
  }
};

const getSecurityContext = async () => {
  try {
    const context = await secureStorage.getItem(STORAGE_KEYS.SECURITY_CONTEXT);
    if (!context) {
      return await initializeSecurityContext();
    }
    return context;
  } catch (error) {
    logError('Failed to get security context', { error });
    return null;
  }
};

// Security Context and MFA Functions
export const initializeSecurityContext = async () => {
  try {
    const context = {
      clientId: crypto.randomUUID(),
      deviceFingerprint: await getDeviceFingerprint(),
      deviceId: await getDeviceId(),
      sessionId: await getSessionId(),
      securityLevel: SECURITY_LEVELS.STANDARD,
      mfaVerified: false,
      failedAttempts: 0,
      lastFailedAttempt: null,
      created: Date.now(),
      lastUpdated: Date.now(),
      lastUserCheck: Date.now(),
      lastTokenRefresh: Date.now()
    };

    await secureStorage.setItem(STORAGE_KEYS.SECURITY_CONTEXT, context, {
      encrypt: true,
      expiry: SECURITY_CONFIG.security.contextTimeout
    });

    securityEvents.emit('security-context-initialized', {
      sessionId: context.sessionId,
      deviceId: context.deviceId,
      timestamp: Date.now()
    });

    return context;
  } catch (error) {
    logError('Security context initialization failed', { error });
    throw new SecurityError('Failed to initialize security context', 'CONTEXT_INIT_FAILED');
  }
};

export const updateSecurityContext = async (updates) => {
  try {
    const currentContext = await getSecurityContext();
    const updatedContext = {
      ...currentContext,
      ...updates,
      lastUpdated: Date.now()
    };

    await secureStorage.setItem(STORAGE_KEYS.SECURITY_CONTEXT, updatedContext, {
      encrypt: true,
      expiry: SECURITY_CONFIG.security.contextTimeout
    });

    return updatedContext;
  } catch (error) {
    logError('Security context update failed', { error });
    throw new SecurityError('Failed to update security context', 'CONTEXT_UPDATE_FAILED');
  }
};

export const initiateMFAChallenge = async (user, method = 'totp') => {
  const threadId = tokenManager.getThreadId();
  
  try {
    if (!SECURITY_CONFIG.mfa.allowedMethods.includes(method)) {
      throw new SecurityError('Invalid MFA method', 'INVALID_MFA_METHOD');
    }

    const context = await getSecurityContext();
    const existingChallenge = await secureStorage.getItem(`mfa_challenge_${user.id}`);
    
    if (existingChallenge) {
      const cooldownRemaining = (SECURITY_CONFIG.mfa.cooldownPeriod * 1000) - 
        (Date.now() - existingChallenge.timestamp);
      
      if (cooldownRemaining > 0) {
        throw new SecurityError(
          `Please wait ${Math.ceil(cooldownRemaining / 1000)} seconds before requesting a new code`,
          'MFA_COOLDOWN'
        );
      }
    }

    const challenge = await MFAService.initiate({
      userId: user.id,
      method,
      metadata: {
        deviceFingerprint: context.deviceFingerprint,
        sessionId: context.sessionId,
        deviceId: context.deviceId,
        threadId
      }
    });

    await secureStorage.setItem(
      `mfa_challenge_${user.id}`,
      {
        challengeId: challenge.id,
        method,
        timestamp: Date.now(),
        attempts: 0
      },
      {
        encrypt: true,
        expiry: SECURITY_CONFIG.mfa.codeExpiry * 1000
      }
    );

    securityEvents.emit('mfa-initiated', {
      userId: user.id,
      method,
      threadId,
      timestamp: Date.now()
    });

    return challenge;
  } catch (error) {
    logError('MFA challenge initiation failed', { error, threadId });
    throw error instanceof SecurityError ? error :
      new SecurityError('Failed to initiate MFA challenge', 'MFA_INITIATION_FAILED');
  }
};

export const verifyMFACode = async (userId, code) => {
  const threadId = tokenManager.getThreadId();
  
  try {
    const challenge = await secureStorage.getItem(`mfa_challenge_${userId}`);
    if (!challenge) {
      throw new SecurityError('No active MFA challenge found', 'NO_MFA_CHALLENGE');
    }

    if (challenge.attempts >= SECURITY_CONFIG.mfa.maxAttempts) {
      await secureStorage.removeItem(`mfa_challenge_${userId}`);
      throw new SecurityError('Maximum verification attempts exceeded', 'MFA_MAX_ATTEMPTS');
    }

    if (Date.now() - challenge.timestamp > SECURITY_CONFIG.mfa.codeExpiry * 1000) {
      await secureStorage.removeItem(`mfa_challenge_${userId}`);
      throw new SecurityError('MFA code has expired', 'MFA_CODE_EXPIRED');
    }

    const context = await getSecurityContext();
    const verified = await MFAService.verify({
      userId,
      challengeId: challenge.challengeId,
      code,
      metadata: {
        deviceFingerprint: context.deviceFingerprint,
        sessionId: context.sessionId,
        deviceId: context.deviceId,
        threadId
      }
    });

    if (verified) {
      await secureStorage.removeItem(`mfa_challenge_${userId}`);
      await updateSecurityContext({
        mfaVerified: true,
        lastMFAVerification: Date.now()
      });

      securityEvents.emit('mfa-verified', {
        userId,
        threadId,
        timestamp: Date.now()
      });

      return true;
    }

    challenge.attempts++;
    await secureStorage.setItem(`mfa_challenge_${userId}`, challenge, {
      encrypt: true,
      expiry: SECURITY_CONFIG.mfa.codeExpiry * 1000
    });

    throw new SecurityError('Invalid MFA code', 'INVALID_MFA_CODE');
  } catch (error) {
    logError('MFA verification failed', { error, threadId });
    throw error instanceof SecurityError ? error :
      new SecurityError('Failed to verify MFA code', 'MFA_VERIFICATION_FAILED');
  }
};

export const setupIdleMonitoring = (dispatch) => {
  try {
    idleMonitor.onIdle(async () => {
      const context = await getSecurityContext();
      if (Date.now() - context.lastUpdated > SECURITY_CONFIG.idle.warningThreshold) {
        dispatch({
          type: AUTH_ACTIONS.IDLE_WARNING,
          payload: {
            warningTime: Date.now(),
            timeoutIn: SECURITY_CONFIG.idle.maxIdleTime - SECURITY_CONFIG.idle.warningThreshold
          }
        });
        
        securityEvents.emit('idle-warning', {
          sessionId: context.sessionId,
          deviceId: context.deviceId,
          timestamp: Date.now()
        });
      }
    });

    idleMonitor.onIdleCheck(async () => {
      try {
        const token = await tokenManager.getToken();
        if (!token || !(await validateToken(token))) {
          throw new SecurityError('Token invalid or expired', 'TOKEN_INVALID');
        }

        if (await tokenManager.shouldRefreshToken(token)) {
          dispatch({
            type: AUTH_ACTIONS.TOKEN_REFRESH_NEEDED,
            payload: { timestamp: Date.now() }
          });
        }
      } catch (error) {
        dispatch({
          type: AUTH_ACTIONS.SESSION_EXPIRED,
          payload: {
            error: error.message,
            code: error.code || 'UNKNOWN',
            timestamp: Date.now()
          }
        });
      }
    });

    return () => {
      idleMonitor.stop();
      logInfo('Idle monitoring stopped');
    };
  } catch (error) {
    logError('Failed to setup idle monitoring', { error });
    throw new SecurityError('Failed to initialize idle monitoring', 'IDLE_MONITOR_FAILED');
  }
};

export const validateSecurityState = async (dispatch) => {
  const threadId = tokenManager.getThreadId();
  
  try {
    const context = await getSecurityContext();
    const token = await tokenManager.getToken();
    
    if (!token) {
      throw new SecurityError('No authentication token found', 'TOKEN_MISSING');
    }

    const securityChecks = [
      {
        condition: !context || !context.deviceFingerprint,
        error: new SecurityError('Invalid security context', 'INVALID_CONTEXT')
      },
      {
        condition: !context.mfaVerified && context.securityLevel >= SECURITY_CONFIG.mfa.requiredLevel,
        error: new SecurityError('MFA verification required', 'MFA_REQUIRED')
      },
      {
        condition: !await validateSession(context),
        error: new SecurityError('Invalid or expired session', 'INVALID_SESSION')
      },
      {
        condition: !await validateToken(token),
        error: new SecurityError('Invalid or expired token', 'TOKEN_INVALID')
      },
      {
        condition: context.failedAttempts >= SECURITY_CONFIG.security.maxFailedAttempts,
        error: new SecurityError('Account temporarily locked', 'ACCOUNT_LOCKED')
      }
    ];

    for (const check of securityChecks) {
      if (check.condition) {
        throw check.error;
      }
    }

    await updateSecurityContext({
      lastValidation: Date.now(),
      failedValidations: 0
    });

    dispatch({
      type: AUTH_ACTIONS.AUTH_STATUS_VERIFIED,
      payload: {
        securityContext: context,
        lastVerified: Date.now(),
        threadId
      }
    });

    return true;
  } catch (error) {
    const context = await getSecurityContext();
    await updateSecurityContext({
      failedValidations: (context.failedValidations || 0) + 1,
      lastFailedValidation: Date.now()
    });

    dispatch({
      type: AUTH_ACTIONS.SECURITY_ERROR,
      payload: {
        error: error.message,
        code: error.code || 'UNKNOWN',
        timestamp: Date.now(),
        threadId
      }
    });

    securityEvents.emit('security-validation-failed', {
      error: error.message,
      code: error.code,
      threadId,
      timestamp: Date.now()
    });

    return false;
  }
};
export const hasPermission = (userRoles = [], requiredRoles = []) => {
  if (!Array.isArray(userRoles) || !Array.isArray(requiredRoles)) {
    return false;
  }
  return requiredRoles.some(role => userRoles.includes(role));
};

// Default export with all public functions and utilities
export default {
  // Core Authentication
  decodeToken,
  validateTokenClaims,
  calculateAuthLevel,
  getCurrentUser,

  // Session Management
  getClientId,
  getDeviceId,
  getSessionId,
  initializeSecurityContext,
  
  // MFA Handling
  initiateMFAChallenge,
  verifyMFACode,
  
  // Security Validation
  validateSecurityState,
  setupIdleMonitoring,
  
  // Utility Functions
  getDeviceFingerprint,
  hasPermission,
  
  // Constants
  SECURITY_LEVELS,
  SECURITY_CONFIG,
  STORAGE_KEYS,
  SECURITY_EVENTS,
  
  // Security Context Management
  updateSecurityContext,
  getSecurityContext,
  
  // Additional Utilities
  isSecurityLevelMet: (requiredLevel, currentLevel) => currentLevel >= requiredLevel,
  
  isMFARequired: async () => {
    const context = await getSecurityContext();
    return context.securityLevel >= SECURITY_CONFIG.mfa.requiredLevel;
  },
  
  isAuthenticated: async () => {
    try {
      const token = await tokenManager.getToken();
      return token && await validateToken(token);
    } catch {
      return false;
    }
  },
  
  getAuthHeaders: async () => {
    try {
      const token = await tokenManager.getToken();
      const sessionId = await getSessionId();
      const deviceId = await getDeviceId();
      const context = await getSecurityContext();
      
      return {
        'Authorization': token ? `Bearer ${token}` : undefined,
        'X-Session-ID': sessionId,
        'X-Device-ID': deviceId,
        'X-Client-Fingerprint': await getDeviceFingerprint(),
        'X-Security-Level': context.securityLevel.toString(),
        'X-MFA-Verified': context.mfaVerified.toString()
      };
    } catch (error) {
      logError('Failed to generate auth headers', { error });
      return {};
    }
  },

  // Development Utilities
  __DEV__: process.env.NODE_ENV === 'development' ? {
    getSecurityContext,
    validateToken,
    validateSession,
    STORAGE_KEYS,
    clearSecurityContext: async () => {
      await secureStorage.clear();
      await initializeSecurityContext();
    },
    simulateSecurityEvent: (eventName, data) => {
      securityEvents.emit(eventName, {
        ...data,
        simulated: true,
        timestamp: Date.now()
      });
    },
    getStorageState: async () => ({
      securityContext: await getSecurityContext(),
      sessionId: await getSessionId(),
      deviceId: await getDeviceId(),
      mfaChallenges: await secureStorage.getItem('mfa_challenges'),
      metrics: {
        failedAttempts: (await getSecurityContext())?.failedAttempts || 0,
        mfaVerified: (await getSecurityContext())?.mfaVerified || false,
        securityLevel: (await getSecurityContext())?.securityLevel
      }
    }),
    resetState: async () => {
      await secureStorage.clear();
      await initializeSecurityContext();
      idleMonitor.reset();
      securityEvents.removeAllListeners();
    }
  } : undefined
};
