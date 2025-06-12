// ✅ [Validated & Hardened] FILE: /frontend/src/utils/sessionManager.js
// Hardened Session Management Utility — v3.1.2

import tokenManager from './tokenManager';
import { emitSecurityEvent, SECURITY_EVENTS } from './security/eventEmitter';
import { SecureStorage } from './security/secureStorage';
import { emitTelemetry, getTraceId } from './telemetry';
import { logInfo, logWarn, logError } from './logging';
import { AUTH_ACTIONS } from '../reducers/authReducer';
import { getSessionId, getClientId, validateSecurityState } from './authUtils';
import createActivityLog from './activityLogger';

const log = {
  info: (msg, meta = {}) => logInfo(msg, meta),
  warn: (msg, meta = {}) => logWarn(msg, meta),
  error: (err, meta = {}) => {
    const error = err instanceof Error ? err : new Error(String(err));
    logError(error, meta);
  }
};

const secureStorage = new SecureStorage({ namespace: 'session' });

const DEFAULT_CONFIG = {
  refreshThresholdMs: 5 * 60 * 1000,
  minRefreshIntervalMs: 30 * 1000,
  maxRefreshRetries: 5,
  backoffMultiplier: 2,
  maxBackoffMs: 60 * 1000,
  inactivityTimeoutMs: 30 * 60 * 1000,
  warningThresholdMs: 25 * 60 * 1000,
  debounceMs: 5000,
  activityEvents: ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'],
  validationIntervalMs: 5 * 60 * 1000,
  enforceDeviceBinding: true,
  enforceSingleSession: true
};

class SessionSecurityError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'SessionSecurityError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

const state = {
  initialized: false,
  timers: {
    refresh: null,
    activity: null,
    warning: null,
    validation: null
  },
  config: {},
  traceId: null,
  threadId: null,
  refreshAttempts: 0,
  lastActivity: Date.now(),
  user: null,
  dispatch: null,
  callbacks: {},
  token: null
};

const sessionContext = {
  get traceId() {
    return state.traceId;
  },
  get threadId() {
    return state.threadId;
  },
  get user() {
    return state.user ? { ...state.user } : null;
  },
  get lastActivity() {
    return new Date(state.lastActivity);
  },
  isInitialized() {
    return state.initialized;
  },
  isSessionActive() {
    return !!state.token;
  }
};

const scheduleTokenRefresh = async () => {
  clearTimeout(state.timers.refresh);
  try {
    const timeUntilExpiry = await tokenManager.getTimeUntilExpiry();
    const refreshIn = Math.max(
      timeUntilExpiry - state.config.refreshThresholdMs,
      state.config.minRefreshIntervalMs
    );

    log.info(`Scheduling token refresh in ${refreshIn}ms`);
    state.timers.refresh = setTimeout(async () => {
      try {
        await refreshToken();
        state.refreshAttempts = 0;
      } catch (error) {
        await handleRefreshFailure(error);
      }
    }, refreshIn);
  } catch (error) {
    log.error('Failed to schedule token refresh', error);
    await handleRefreshFailure(error);
  }
};

const refreshToken = async () => {
  log.info('Attempting token refresh');
  const validSecurity = await validateSecurityState(state.dispatch);
  if (!validSecurity) {
    throw new SessionSecurityError('Security validation failed', 'SECURITY_VALIDATION');
  }

  const refreshed = await state.callbacks.refreshCallback();
  if (!refreshed?.token) {
    throw new SessionSecurityError('No token returned', 'INVALID_REFRESH');
  }

  await tokenManager.setToken(refreshed.token);
  if (refreshed.refreshToken) {
    await tokenManager.setRefreshToken(refreshed.refreshToken);
  }

  state.dispatch({
    type: AUTH_ACTIONS.REFRESH_SESSION,
    payload: {
      token: refreshed.token,
      sessionExpiry: new Date(Date.now() + refreshed.expiresIn * 1000)
    }
  });

  await Promise.all([
    emitTelemetry('token_refreshed', {
      userId: state.user.id,
      threadId: state.threadId
    }),
    logSessionActivity('TOKEN_REFRESH')
  ]);

  await scheduleTokenRefresh();
};
const handleRefreshFailure = async (error) => {
  state.refreshAttempts++;

  const backoff = Math.min(
    state.config.minRefreshIntervalMs *
      Math.pow(state.config.backoffMultiplier, state.refreshAttempts),
    state.config.maxBackoffMs
  );

  log.warn(`Refresh failed (attempt ${state.refreshAttempts}), retrying in ${backoff}ms`);

  await emitTelemetry('refresh_failure', {
    userId: state.user.id,
    attempt: state.refreshAttempts,
    error: error.message,
    traceId: state.traceId,
    threadId: state.threadId
  });

  if (state.refreshAttempts >= state.config.maxRefreshRetries) {
    await triggerSecurityViolation('MAX_REFRESH_ATTEMPTS', error);
    return;
  }

  clearTimeout(state.timers.refresh);
  state.timers.refresh = setTimeout(() => scheduleTokenRefresh(), backoff);
};

const resetActivityTimeout = () => {
  clearTimeout(state.timers.activity);
  clearTimeout(state.timers.warning);

  state.timers.warning = setTimeout(() => {
    state.dispatch({
      type: AUTH_ACTIONS.ACTIVITY_WARNING,
      payload: { timestamp: Date.now() }
    });
  }, state.config.warningThresholdMs);

  state.timers.activity = setTimeout(() => {
    triggerSecurityViolation('INACTIVITY_TIMEOUT', 
      new SessionSecurityError('Session expired due to inactivity', 'TIMEOUT')
    );
  }, state.config.inactivityTimeoutMs);
};

const handleActivity = () => {
  const now = Date.now();
  if (now - state.lastActivity >= state.config.debounceMs) {
    state.lastActivity = now;
    resetActivityTimeout();
    emitTelemetry('user_activity', {
      userId: state.user.id,
      timestamp: now,
      traceId: state.traceId
    });
  }
};

const bindActivityListeners = () => {
  state.config.activityEvents.forEach((event) =>
    window.addEventListener(event, handleActivity, { passive: true })
  );
  resetActivityTimeout();
};

const unbindActivityListeners = () => {
  state.config.activityEvents.forEach((event) =>
    window.removeEventListener(event, handleActivity)
  );
};

const triggerSecurityViolation = async (type, error) => {
  const violation = {
    type,
    error: error.message,
    code: error.code || 'UNKNOWN',
    userId: state.user.id,
    traceId: state.traceId,
    timestamp: new Date().toISOString()
  };

  log.error('Security violation occurred', violation);

  await Promise.all([
    emitSecurityEvent(SECURITY_EVENTS.SECURITY_VIOLATION, violation),
    emitTelemetry('security_violation', violation)
  ]);

  if (typeof state.callbacks.onSecurityViolation === 'function') {
    await state.callbacks.onSecurityViolation(violation);
  }

  await logout();
};

const clearAllTimers = () => {
  Object.values(state.timers).forEach(clearTimeout);
  state.timers = {
    refresh: null,
    activity: null,
    warning: null,
    validation: null
  };
};

const cleanup = async () => {
  clearAllTimers();
  unbindActivityListeners();
  state.initialized = false;
};

const logout = async () => {
  try {
    await cleanup();
    await tokenManager.clearTokens();
    await secureStorage.removeItem('session_initialized');

    await Promise.all([
      emitSecurityEvent(SECURITY_EVENTS.SESSION_END, {
        userId: state.user.id,
        traceId: state.traceId
      }),
      logSessionActivity('SESSION_END')
    ]);

    if (typeof state.callbacks.onLogout === 'function') {
      await state.callbacks.onLogout();
    }

    log.info('Session securely terminated');
  } catch (error) {
    log.error('Error during logout', error);
    throw error;
  }
};

const logSessionActivity = async (eventType, metadata = {}) => {
  try {
    await createActivityLog({
      action: eventType,
      metadata: {
        userId: state.user.id,
        clientId: await getClientId(),
        sessionId: await getSessionId(),
        traceId: state.traceId,
        ...metadata
      }
    });
  } catch (error) {
    log.warn('Activity log failed', error);
  }
};

const validateAndInjectDefaults = (opts = {}) => {
  const required = ['token', 'user', 'dispatch', 'onLogout', 'refreshCallback'];
  const missing = required.filter((key) => !opts[key]);

  if (missing.length > 0) {
    throw new SessionSecurityError(
      `Missing required session options: ${missing.join(', ')}`,
      'MISSING_SESSION_OPTIONS'
    );
  }

  return {
    config: {
      ...DEFAULT_CONFIG,
      ...(opts.config || {})
    },
    callbacks: {
      onLogout: opts.onLogout,
      onSessionExpired: opts.onSessionExpired || (() => {}),
      onSecurityViolation: opts.onSecurityViolation || (() => {}),
      refreshCallback: opts.refreshCallback
    }
  };
};

const initializeSessionInternals = async () => {
  try {
    if (!state.user?.id || !state.token) {
      throw new SessionSecurityError('Missing user or token', 'SESSION_INIT_INVALID');
    }

    const isValid = await tokenManager.validateToken(state.token, {
      expectedSubject: state.user.id,
      validateIssuer: true
    });

    if (!isValid) {
      throw new SessionSecurityError('Initial token validation failed', 'INVALID_INITIAL_TOKEN');
    }

    await secureStorage.setItem('session_initialized', { timestamp: Date.now() });

    bindActivityListeners();
    await scheduleTokenRefresh();

    await Promise.all([
      emitSecurityEvent(SECURITY_EVENTS.SESSION_START, {
        userId: state.user.id,
        traceId: state.traceId
      }),
      logSessionActivity('SESSION_START')
    ]);

    log.info('Session initialized successfully');
  } catch (error) {
    await cleanup();
    throw error;
  }
};

export const setupSession = async (options) => {
  const { config, callbacks } = validateAndInjectDefaults(options);

  Object.assign(state, {
    token: options.token,
    user: options.user,
    dispatch: options.dispatch,
    callbacks,
    config,
    traceId: getTraceId(),
    lastActivity: Date.now(),
    refreshAttempts: 0,
    initialized: false
  });

  try {
    await initializeSessionInternals();
    state.initialized = true;
    
    return async () => {
      await logout();
    };
  } catch (error) {
    await cleanup();
    throw error;
  }
};

/**
 * Enhanced session management setup that integrates with AuthContext
 * @param {Object} options Configuration options
 * @returns {Promise<Object>} Session management interface
 */
export const setupSessionManagement = async ({
  token,
  user,
  dispatch,
  securityProfile,
  deviceTrust,
  sessionContext: contextData,
  onLogout,
  refreshCallback,
  onActivity,
  securityConfig = {}
}) => {
  // Initialize core session
  const cleanupFn = await setupSession({
    token,
    user,
    dispatch,
    config: {
      ...DEFAULT_CONFIG,
      ...securityConfig
    },
    callbacks: {
      onLogout,
      refreshCallback,
      onActivity,
      onSecurityViolation: async (violation) => {
        await emitSecurityEvent(SECURITY_EVENTS.SECURITY_VIOLATION, {
          ...violation,
          securityProfile,
          deviceTrust
        });
      }
    }
  });

  // Enhanced security state
  const securityState = {
    profile: securityProfile,
    deviceTrust,
    sessionContext: contextData,
    validationTimestamp: Date.now()
  };

  const validateSessionSecurity = async () => {
    try {
      const validSecurity = await validateSecurityState({
        token: state.token,
        deviceTrust: securityState.deviceTrust,
        securityProfile: securityState.profile
      });

      if (!validSecurity) {
        throw new SessionSecurityError('Security validation failed', 'INVALID_SECURITY_STATE');
      }

      securityState.validationTimestamp = Date.now();
      return true;
    } catch (error) {
      await triggerSecurityViolation('SECURITY_VALIDATION_FAILED', error);
      return false;
    }
  };

  return {
    // Session status
    isInitialized: () => state.initialized,
    getSecurityContext: () => ({
      user: state.user,
      deviceTrust: securityState.deviceTrust,
      securityProfile: securityState.profile,
      sessionContext: securityState.sessionContext,
      lastActivity: state.lastActivity,
      validationTimestamp: securityState.validationTimestamp
    }),

    // Session operations
    validateSession: validateSessionSecurity,
    refresh: async () => {
      return await refreshCallback();
    },

    // Activity management
    handleActivity: () => {
      handleActivity();
      if (onActivity) onActivity();
    },

    // Security operations
    elevateSession: async (factor) => {
      // Implement your session elevation logic here
      throw new Error('Session elevation not implemented');
    },

    validateSecurityFactor: async (factor) => {
      // Implement your factor validation logic here
      throw new Error('Security factor validation not implemented');
    },

    // Cleanup
    cleanup: async () => {
      await cleanupFn();
    }
  };
};

export const endSession = async () => {
  await logout();
};

export {
  SessionSecurityError,
  DEFAULT_CONFIG as SESSION_CONFIG,
  sessionContext
};
