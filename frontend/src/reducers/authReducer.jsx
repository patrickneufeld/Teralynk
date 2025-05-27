// ✅ FILE: /frontend/src/reducers/authReducer.js

import { AUTH_STATUS } from "@/constants/auth"; // ✅ Correct named export

export const AUTH_ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_STATUS: "SET_STATUS",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  REFRESH_SESSION: "REFRESH_SESSION",
  LOGOUT: "LOGOUT",
  UPDATE_USER: "UPDATE_USER",
  UPDATE_SETTINGS: "UPDATE_SETTINGS",
  UPDATE_PERMISSIONS: "UPDATE_PERMISSIONS",
  CLEAR_ERROR: "CLEAR_ERROR",
};

export const initialState = {
  user: null,
  loggedIn: false,
  loading: true,
  error: null,
  errorDetails: null,
  status: AUTH_STATUS.IDLE,
  sessionExpiry: null,
  permissions: [],
  services: [],
  settings: {},
};

export const authReducer = (state, action) => {
  if (!action || typeof action !== 'object') return state;

  const { type, payload = {} } = action;

  switch (type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: !!payload.loading,
        error: payload.error || null,
      };

    case AUTH_ACTIONS.SET_STATUS:
      return {
        ...state,
        status: payload.status || AUTH_STATUS.IDLE,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: payload.user || null,
        permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
        services: Array.isArray(payload.services) ? payload.services : [],
        settings: payload.settings || {},
        sessionExpiry: payload.sessionExpiry || null,
        loggedIn: true,
        loading: false,
        error: null,
        errorDetails: null,
        status: AUTH_STATUS.AUTHENTICATED,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        error: payload.error || "Login failed",
        errorDetails: payload.errorDetails || null,
        loading: false,
        status: payload.status || AUTH_STATUS.UNAUTHENTICATED,
        loggedIn: false,
        user: null,
        permissions: [],
        services: [],
        settings: {},
      };

    case AUTH_ACTIONS.SESSION_EXPIRED:
      return {
        ...state,
        user: null,
        loggedIn: false,
        loading: false,
        error: payload.error || "Session expired",
        errorDetails: payload.errorDetails || null,
        status: payload.status || AUTH_STATUS.EXPIRED,
        sessionExpiry: null,
        permissions: [],
      };

    case AUTH_ACTIONS.REFRESH_SESSION:
      return {
        ...state,
        user: payload.user || state.user,
        sessionExpiry: payload.sessionExpiry || state.sessionExpiry,
        status: payload.status || state.status,
        authLevel: payload.authLevel || state.authLevel,
        securityProfile: payload.securityProfile || state.securityProfile,
        sessionContext: payload.sessionContext || state.sessionContext,
        error: null,
        loading: false,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        loading: false,
        status: payload.status || AUTH_STATUS.UNAUTHENTICATED,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: {
          ...state.user,
          ...(payload.userData || {}),
        },
      };

    case AUTH_ACTIONS.UPDATE_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...(payload.settings || {}),
        },
      };

    case AUTH_ACTIONS.UPDATE_PERMISSIONS:
      return {
        ...state,
        permissions: Array.isArray(payload.permissions)
          ? [...payload.permissions]
          : state.permissions,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
        errorDetails: null,
      };

    default:
      return state;
  }
};

export default authReducer;
