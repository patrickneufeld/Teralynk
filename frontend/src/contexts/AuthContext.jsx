// ================================================
// ✅ FILE: /frontend/src/contexts/AuthContext.jsx
// Hardened React Auth Context with Security Events (v2.2.4)
// ================================================

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import api from '@/api/apiClient';
import { authReducer, initialState, AUTH_ACTIONS } from '@/reducers/authReducer';
import { SECURITY_POLICIES } from '@/constants/auth';
import { logInfo, logError, logDebug } from '@/utils/logging';
import { SECURITY_EVENTS, emitSecurityEvent, securityEvents } from '@/utils/security/eventEmitter';
import { secureStorage } from '@/utils/security/secureStorage';

import {
  getToken,
  setToken,
  removeToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  validateTokenIntegrity,
  decodeToken,
} from '@/utils/tokenManager';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const validateAndDecodeToken = async (token, { gracePeriod = 0 } = {}) => {
  if (!token || typeof token !== 'string') return null;

  try {
    const isValid = await validateTokenIntegrity(token);
    if (!isValid) return null;

    const decoded = decodeToken(token);
    if (!decoded || typeof decoded !== 'object') return null;

    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp <= now - gracePeriod || decoded.iat > now + 10) return null;

    const requiredClaims = ['sub', 'exp', 'iat', 'iss'];
    const missing = requiredClaims.filter(c => !(c in decoded));
    if (missing.length > 0) return null;

    return decoded;
  } catch (err) {
    logError('Token validation error', err);
    return null;
  }
};

export const AuthProvider = ({
  children,
  securityConfig = SECURITY_POLICIES.DEFAULT,
  onSecurityEvent,
}) => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(authReducer, {
    ...initialState,
    securityConfig,
  });

  const timers = useRef({ activity: null, refresh: null, security: null });
  const securityState = useRef({
    initialized: false,
    failedRefreshAttempts: 0,
    lastActivityTime: Date.now(),
    securityChecks: {},
  });

  const {
    user, loggedIn, loading, error, status, sessionExpiry,
    authLevel, securityFlags, mfaRequired, deviceVerified
  } = state;

  const cleanupTimers = useCallback(() => {
    Object.values(timers.current).forEach(clearTimeout);
    timers.current = { activity: null, refresh: null, security: null };

    emitSecurityEvent(SECURITY_EVENTS.SESSION_END, { timestamp: Date.now(), userId: user?.id });
    logInfo('Security cleanup completed', { userId: user?.id });
  }, [user]);

  const handleLogout = useCallback(async (reason = 'USER_INITIATED') => {
    try {
      cleanupTimers();
      await removeToken();
      await removeRefreshToken();
      await secureStorage.clear();

      dispatch({ type: AUTH_ACTIONS.LOGOUT, payload: { reason } });

      emitSecurityEvent(SECURITY_EVENTS.AUTH_LOGOUT, {
        reason,
        userId: user?.id,
        timestamp: Date.now()
      });

      navigate('/login', { replace: true, state: { reason } });
    } catch (err) {
      logError('Logout failed', err);
      cleanupTimers();
      navigate('/login', { replace: true });
    }
  }, [navigate, cleanupTimers, user]);

  const handleTokenRefresh = useCallback(async () => {
    try {
      const maxAttempts = securityConfig.maxRefreshAttempts || 3;
      if (securityState.current.failedRefreshAttempts >= maxAttempts) {
        throw new Error('Max refresh attempts exceeded');
      }

      const refreshToken = await getRefreshToken();
      const isValidRefresh = await validateTokenIntegrity(refreshToken);
      if (!refreshToken || !isValidRefresh) throw new Error('Invalid refresh token');

      const response = await api.post('/auth/refresh', {
        refreshToken,
        deviceId: await secureStorage.getItem('deviceId'),
      });

      const { token, user: refreshedUser, expiresIn } = response.data;
      const decoded = await validateAndDecodeToken(token);
      if (!decoded) throw new Error('Invalid token received');

      await setToken(token);
      await setRefreshToken(refreshToken);

      const expiry = Date.now() + expiresIn * 1000;
      const refreshDelay = Math.max(expiry - Date.now() - 5 * 60 * 1000, 1000);

      dispatch({
        type: AUTH_ACTIONS.REFRESH_SUCCESS,
        payload: { user: refreshedUser, token, sessionExpiry: expiry },
      });

      securityState.current.failedRefreshAttempts = 0;
      timers.current.refresh = setTimeout(handleTokenRefresh, refreshDelay);

      emitSecurityEvent(SECURITY_EVENTS.TOKEN_REFRESH, {
        userId: refreshedUser?.id,
        timestamp: Date.now(),
      });
    } catch (err) {
      securityState.current.failedRefreshAttempts++;
      logError('Token refresh failed', err);

      if (securityState.current.failedRefreshAttempts < (securityConfig.maxRefreshAttempts || 3)) {
        const backoff = Math.min(1000 * 2 ** securityState.current.failedRefreshAttempts, 30000);
        timers.current.refresh = setTimeout(handleTokenRefresh, backoff);
      } else {
        handleLogout('REFRESH_FAILED');
      }
    }
  }, [securityConfig.maxRefreshAttempts, handleLogout]);

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return false;

      const decoded = await validateAndDecodeToken(token);
      if (!decoded) return false;

      const response = await api.get('/auth/me');
      const verifiedUser = response.data?.user;
      if (!verifiedUser || !verifiedUser.id) return false;

      dispatch({
        type: AUTH_ACTIONS.AUTH_STATUS_VERIFIED,
        payload: {
          user: verifiedUser,
          token,
          sessionExpiry: decoded.exp * 1000,
        },
      });

      const refreshDelay = Math.max(decoded.exp * 1000 - Date.now() - 5 * 60 * 1000, 1000);
      timers.current.refresh = setTimeout(handleTokenRefresh, refreshDelay);

      emitSecurityEvent(SECURITY_EVENTS.AUTH_SUCCESS, {
        userId: verifiedUser.id,
        timestamp: Date.now(),
      });

      return true;
    } catch (err) {
      logError('Auth status check failed', err);
      emitSecurityEvent(SECURITY_EVENTS.AUTH_FAILURE, { error: err.message });
      return false;
    }
  }, [handleTokenRefresh]);

  const login = useCallback(async (email, password, options = {}) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        deviceId: await secureStorage.getItem('deviceId'),
      }, options);

      const { token, refreshToken, user, expiresIn } = response.data;

      const decoded = await validateAndDecodeToken(token);
      if (!decoded) throw new Error('Invalid token received');

      await setToken(token);
      await setRefreshToken(refreshToken);

      const expiry = Date.now() + expiresIn * 1000;
      timers.current.refresh = setTimeout(handleTokenRefresh, expiresIn * 1000);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user,
          token,
          sessionExpiry: expiry,
        },
      });

      emitSecurityEvent(SECURITY_EVENTS.AUTH_SUCCESS, {
        userId: user?.id,
        timestamp: Date.now(),
      });

      return { success: true };
    } catch (err) {
      logError('Login failed', err);
      return { success: false, message: err.message || 'Login error' };
    }
  }, [handleTokenRefresh]);

  const resetInactivityTimer = useCallback(() => {
    if (!loggedIn) return;

    clearTimeout(timers.current.activity);
    securityState.current.lastActivityTime = Date.now();

    const timeout = securityConfig.sessionTimeout || 30 * 60 * 1000;
    timers.current.activity = setTimeout(() => {
      emitSecurityEvent(SECURITY_EVENTS.SESSION_TIMEOUT, {
        userId: user?.id,
        timestamp: Date.now(),
      });
      handleLogout('SESSION_TIMEOUT');
    }, timeout);
  }, [loggedIn, user, securityConfig.sessionTimeout, handleLogout]);

  useEffect(() => {
    const initializeAuth = async () => {
      if (securityState.current.initialized) return;

      try {
        dispatch({ type: AUTH_ACTIONS.AUTH_INIT_START });

        const securityCheck = async () => {
          const authenticated = await checkAuthStatus();
          if (authenticated) resetInactivityTimer();
          timers.current.security = setTimeout(
            securityCheck,
            securityConfig.checkInterval || 5 * 60 * 1000
          );
        };

        await securityCheck();

        dispatch({
          type: AUTH_ACTIONS.AUTH_INIT_COMPLETE,
          payload: { initialized: true },
        });

        securityState.current.initialized = true;
        logInfo('Auth initialization complete');
      } catch (err) {
        logError('Auth initialization failed', err);
        dispatch({
          type: AUTH_ACTIONS.AUTH_INIT_ERROR,
          payload: { error: err.message },
        });
      }
    };

    initializeAuth();
    return cleanupTimers;
  }, [checkAuthStatus, cleanupTimers, resetInactivityTimer, securityConfig]);

  useEffect(() => {
    if (onSecurityEvent) return securityEvents.on('*', onSecurityEvent);
  }, [onSecurityEvent]);

  useEffect(() => {
    if (loggedIn) {
      resetInactivityTimer();
      const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
      const handler = () => resetInactivityTimer();

      events.forEach(e => window.addEventListener(e, handler, { passive: true }));
      return () => events.forEach(e => window.removeEventListener(e, handler));
    }
  }, [loggedIn, resetInactivityTimer]);

  const contextValue = useMemo(() => ({
  user,
  loggedIn,
  isAuthenticated: loggedIn, // ✅ Fix here
  loading,
  error,
  status,
  sessionExpiry,
  authLevel,
  securityFlags,
  mfaRequired,
  deviceVerified,
  login,
  refreshToken: handleTokenRefresh,
  checkAuthStatus,
  resetInactivityTimer,
  logout: handleLogout,
  getSecurityState: () => ({
    ...securityState.current,
    lastActivity: Date.now() - securityState.current.lastActivityTime,
  }),
}), [
  user,
  loggedIn,
  loading,
  error,
  status,
  sessionExpiry,
  authLevel,
  securityFlags,
  mfaRequired,
  deviceVerified,
  login,
  handleTokenRefresh,
  checkAuthStatus,
  resetInactivityTimer,
  handleLogout,
]);


  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
  securityConfig: PropTypes.shape({
    sessionTimeout: PropTypes.number,
    checkInterval: PropTypes.number,
    maxRefreshAttempts: PropTypes.number,
    mfaRequired: PropTypes.bool,
    deviceVerificationRequired: PropTypes.bool,
  }),
  onSecurityEvent: PropTypes.func,
};

export default AuthProvider;
