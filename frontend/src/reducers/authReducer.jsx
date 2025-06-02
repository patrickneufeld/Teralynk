// ================================================
// ✅ FILE: /frontend/src/reducers/authReducer.js
// Auth state management with enhanced security and type safety
// ================================================

import { AUTH_STATUS } from "@/constants/auth";

// Action Types with Descriptions
export const AUTH_ACTIONS = {
  // Core Authentication Actions
  AUTH_INIT_START: "AUTH_INIT_START",
  AUTH_INIT_COMPLETE: "AUTH_INIT_COMPLETE",
  AUTH_INIT_ERROR: "AUTH_INIT_ERROR",
  SET_LOADING: "SET_LOADING",
  SET_STATUS: "SET_STATUS",
  
  // Login Flow Actions
  LOGIN_START: "LOGIN_START",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  
  // Session Management
  SESSION_EXPIRED: "SESSION_EXPIRED",
  SESSION_REFRESH_START: "SESSION_REFRESH_START",
  SESSION_REFRESH_SUCCESS: "SESSION_REFRESH_SUCCESS",
  SESSION_REFRESH_FAILURE: "SESSION_REFRESH_FAILURE",
  
  // User Management
  LOGOUT: "LOGOUT",
  UPDATE_USER: "UPDATE_USER",
  UPDATE_SETTINGS: "UPDATE_SETTINGS",
  UPDATE_PERMISSIONS: "UPDATE_PERMISSIONS",
  
  // Security Actions
  SECURITY_EVENT: "SECURITY_EVENT",
  SECURITY_VIOLATION: "SECURITY_VIOLATION",
  
  // Error Management
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR"
};

// Initial State with Type Definitions
export const initialState = {
  // User Data
  user: null,
  loggedIn: false,
  permissions: [],
  services: [],
  settings: {},
  
  // Session State
  loading: true,
  status: AUTH_STATUS.IDLE,
  sessionExpiry: null,
  lastActivity: null,
  
  // Security Context
  securityLevel: 'standard',
  mfaEnabled: false,
  mfaVerified: false,
  securityFlags: {},
  
  // Error Handling
  error: null,
  errorDetails: null,
  errorCode: null,
  
  // Audit Trail
  loginAttempts: 0,
  lastLoginAttempt: null,
  sessionHistory: [],
  
  // Feature Flags
  features: {},
  
  // System State
  initialized: false,
  version: '1.0.0'
};

// Utility Functions
const validatePayload = (payload, requiredFields = []) => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  return requiredFields.every(field => field in payload);
};

const updateSecurityMetadata = (state, action) => {
  return {
    ...state,
    lastActivity: Date.now(),
    securityFlags: {
      ...state.securityFlags,
      lastAction: action.type,
      lastActionTimestamp: Date.now()
    }
  };
};

// Main Reducer
export const authReducer = (state, action) => {
  // Input validation
  if (!action || typeof action !== 'object') {
    console.error('Invalid action provided to authReducer');
    return state;
  }

  const { type, payload = {}, meta = {} } = action;

  // Apply security metadata updates to all state changes
  const secureState = updateSecurityMetadata(state, action);

  switch (type) {
    case AUTH_ACTIONS.AUTH_INIT_START:
      return {
        ...secureState,
        loading: true,
        status: AUTH_STATUS.INITIALIZING,
        initialized: false
      };

    case AUTH_ACTIONS.AUTH_INIT_COMPLETE:
      return {
        ...secureState,
        loading: false,
        status: AUTH_STATUS.READY,
        initialized: true,
        error: null
      };

    case AUTH_ACTIONS.AUTH_INIT_ERROR:
      return {
        ...secureState,
        loading: false,
        status: AUTH_STATUS.ERROR,
        error: payload.error,
        errorDetails: payload.errorDetails,
        errorCode: payload.errorCode,
        initialized: false
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...secureState,
        loading: !!payload.loading,
        error: payload.error || null
      };

    case AUTH_ACTIONS.SET_STATUS:
      if (!validatePayload(payload, ['status'])) {
        return state;
      }
      return {
        ...secureState,
        status: payload.status
      };

    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...secureState,
        loading: true,
        loginAttempts: state.loginAttempts + 1,
        lastLoginAttempt: Date.now(),
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      if (!validatePayload(payload, ['user'])) {
        return state;
      }
      return {
        ...secureState,
        user: payload.user,
        permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
        services: Array.isArray(payload.services) ? payload.services : [],
        settings: payload.settings || {},
        sessionExpiry: payload.sessionExpiry || null,
        loggedIn: true,
        loading: false,
        error: null,
        errorDetails: null,
        status: AUTH_STATUS.AUTHENTICATED,
        mfaVerified: payload.mfaVerified || false,
        sessionHistory: [
          ...state.sessionHistory,
          {
            timestamp: Date.now(),
            type: 'login',
            success: true
          }
        ]
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...secureState,
        error: payload.error || "Authentication failed",
        errorDetails: payload.errorDetails || null,
        errorCode: payload.errorCode || 'AUTH_ERROR',
        loading: false,
        status: payload.status || AUTH_STATUS.UNAUTHENTICATED,
        loggedIn: false,
        sessionHistory: [
          ...state.sessionHistory,
          {
            timestamp: Date.now(),
            type: 'login',
            success: false,
            error: payload.error
          }
        ]
      };

    case AUTH_ACTIONS.SESSION_EXPIRED:
      return {
        ...secureState,
        user: null,
        loggedIn: false,
        loading: false,
        error: payload.error || "Session expired",
        errorDetails: payload.errorDetails || null,
        status: AUTH_STATUS.EXPIRED,
        sessionExpiry: null,
        permissions: [],
        mfaVerified: false,
        sessionHistory: [
          ...state.sessionHistory,
          {
            timestamp: Date.now(),
            type: 'session_expired',
            reason: payload.reason
          }
        ]
      };

    case AUTH_ACTIONS.SESSION_REFRESH_SUCCESS:
      return {
        ...secureState,
        sessionExpiry: payload.sessionExpiry,
        status: AUTH_STATUS.AUTHENTICATED,
        error: null,
        loading: false
      };

    case AUTH_ACTIONS.SECURITY_EVENT:
      return {
        ...secureState,
        securityFlags: {
          ...state.securityFlags,
          ...payload.flags
        }
      };

    case AUTH_ACTIONS.SECURITY_VIOLATION:
      return {
        ...secureState,
        error: payload.error || "Security violation detected",
        status: AUTH_STATUS.SECURITY_VIOLATION,
        securityFlags: {
          ...state.securityFlags,
          violation: true,
          violationType: payload.violationType,
          violationTimestamp: Date.now()
        }
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        loading: false,
        status: payload.status || AUTH_STATUS.UNAUTHENTICATED,
        sessionHistory: [
          ...state.sessionHistory,
          {
            timestamp: Date.now(),
            type: 'logout',
            reason: payload.reason
          }
        ],
        version: state.version // Preserve version across logouts
      };

    case AUTH_ACTIONS.UPDATE_USER:
      if (!state.loggedIn) return state;
      return {
        ...secureState,
        user: {
          ...state.user,
          ...(payload.userData || {})
        }
      };

    case AUTH_ACTIONS.UPDATE_SETTINGS:
      return {
        ...secureState,
        settings: {
          ...state.settings,
          ...(payload.settings || {})
        }
      };

    case AUTH_ACTIONS.UPDATE_PERMISSIONS:
      return {
        ...secureState,
        permissions: Array.isArray(payload.permissions)
          ? [...payload.permissions]
          : state.permissions
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...secureState,
        error: null,
        errorDetails: null,
        errorCode: null
      };

    default:
      return state;
  }
};

export default authReducer;
