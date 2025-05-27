// ================================================
// ✅ FILE: /frontend/src/contexts/AuthContext.jsx
// Hardened React Auth Context with token handling, refresh, and security logic
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
import { authReducer, initialState } from '@/reducers/authReducer';
import { SECURITY_POLICIES } from '@/constants/auth';
import { logInfo, logError, logWarn } from '@/utils/logging/logging';
import { SecurityEventEmitter } from '@/utils/security/eventEmitter';
import { securityMonitor } from '@/utils/security/SecurityMonitor';
import {
  getToken,
  setToken,
  removeToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  validateTokenIntegrity,
} from '@/utils/tokenManager';
import { decodeToken } from '@/utils/authUtils';

// 🔐 Context
const AuthContext = createContext(null);
const securityEvents = new SecurityEventEmitter();

// 🧠 Hook
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

// 🧪 Validate and decode JWT
const validateAndDecodeToken = async (token, { gracePeriod = 0 } = {}) => {
  if (!token || typeof token !== 'string') return null;

  try {
    if (!validateTokenIntegrity(token)) {
      logError('❌ Token integrity check failed');
      return null;
    }

    const decoded = decodeToken(token);
    if (!decoded || typeof decoded !== 'object') {
      logError('❌ Token decode failed');
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp <= now - gracePeriod) {
      logError('❌ Token expired');
      return null;
    }

    if (decoded.iat > now + 10) {
      logError('❌ Token issued in the future');
      return null;
    }

    return decoded;
  } catch (err) {
    logError('❌ Token validation exception', err);
    return null;
  }
};

// ⏱️ Token Timing
const calculateTokenExpiry = (expiresIn) => Date.now() + expiresIn * 1000;
const calculateOptimalRefreshTime = (expiry) =>
  Math.max(expiry - Date.now() - 5 * 60 * 1000, 1000);
const calculateBackoffTime = (attempt) =>
  Math.min(1000 * 2 ** attempt, 30000);

// ✅ AuthProvider Component
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

  const securityRefs = {
    activity: useRef(null),
    refresh: useRef(null),
    initialization: useRef(false),
    failedAttempts: useRef(0),
  };

  const {
    user,
    loggedIn,
    loading,
    error,
    status,
    sessionExpiry,
    authLevel,
    securityFlags,
  } = state;

  useEffect(() => {
    if (onSecurityEvent) {
      securityEvents.on('security-event', onSecurityEvent);
      return () => securityEvents.off('security-event', onSecurityEvent);
    }
  }, [onSecurityEvent]);

  const cleanupTimers = useCallback(() => {
    Object.values(securityRefs).forEach((ref) => {
      if (ref?.current) {
        clearTimeout(ref.current);
        ref.current = null;
      }
    });

    try {
      securityEvents.emit('security-event', { type: 'SECURITY_CLEANUP' });
    } catch (err) {
      logError('Security event emission failed', err);
    }

    logInfo('🧹 Security cleanup executed');
  }, []);

  const resetInactivityTimer = useCallback(() => {
    cleanupTimers();
    if (!loggedIn) return;

    const timeout = securityConfig.sessionTimeout || 30 * 60 * 1000;
    securityRefs.activity.current = setTimeout(() => {
      try {
        securityEvents.emit('security-event', {
          type: 'SESSION_TIMEOUT',
          userId: user?.id,
        });
      } catch (err) {
        logError('Security event emission failed', err);
      }

      dispatch({
        type: 'SESSION_EXPIRED',
        payload: {
          error: 'Session expired due to inactivity',
          errorDetails: 'Please login again to continue.',
        },
      });

      navigate('/login', { replace: true, state: { reason: 'TIMEOUT' } });
    }, timeout);
  }, [loggedIn, navigate, user?.id, cleanupTimers, securityConfig]);

  const handleTokenRefresh = useCallback(async () => {
    try {
      if (securityRefs.failedAttempts.current >= (securityConfig.maxRefreshAttempts || 3)) {
        throw new Error('Max refresh attempts exceeded');
      }

      const refreshToken = getRefreshToken();
      if (!refreshToken || !validateTokenIntegrity(refreshToken)) {
        throw new Error('Invalid refresh token');
      }

      const res = await api.post('/api/auth/refresh', { refreshToken });
      const { token, user: refreshedUser, expiresIn } = res.data;

      const decoded = await validateAndDecodeToken(token);
      if (!decoded) throw new Error('Invalid token');

      setToken(token);
      setRefreshToken(refreshToken);
      const expiry = calculateTokenExpiry(expiresIn);

      dispatch({
        type: 'REFRESH_SUCCESS',
        payload: { user: refreshedUser, token, sessionExpiry: expiry },
      });

      const delay = calculateOptimalRefreshTime(expiry);
      securityRefs.failedAttempts.current = 0;
      securityRefs.refresh.current = setTimeout(handleTokenRefresh, delay);
    } catch (err) {
      const attempt = ++securityRefs.failedAttempts.current;
      logError('🔁 Token refresh failed', { attempt, err });

      if (attempt < (securityConfig.maxRefreshAttempts || 3)) {
        const backoff = calculateBackoffTime(attempt);
        securityRefs.refresh.current = setTimeout(handleTokenRefresh, backoff);
      } else {
        dispatch({
          type: 'AUTH_ERROR',
          payload: { error: 'Maximum refresh attempts exceeded' },
        });
        navigate('/login');
      }
    }
  }, [navigate, securityConfig]);

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return false;

      const decoded = await validateAndDecodeToken(token);
      if (!decoded) return false;

      const res = await api.get('/api/auth/me');
      const { user: verifiedUser } = res.data;

      dispatch({
        type: 'AUTH_STATUS_VERIFIED',
        payload: {
          user: verifiedUser,
          token,
          sessionExpiry: decoded.exp * 1000,
        },
      });

      const refreshDelay = calculateOptimalRefreshTime(decoded.exp * 1000);
      securityRefs.refresh.current = setTimeout(handleTokenRefresh, refreshDelay);

      return true;
    } catch (err) {
      logError('Auth check failed', err);
      return false;
    }
  }, [handleTokenRefresh]);

  useEffect(() => {
    const init = async () => {
      if (!securityRefs.initialization.current) {
        try {
          securityMonitor.start();
          securityMonitor.addCheck(
            'session',
            checkAuthStatus,
            securityConfig.checkInterval || 5 * 60 * 1000
          );

          await checkAuthStatus();
          dispatch({ type: 'AUTH_READY' });
          securityRefs.initialization.current = true;

          logInfo('✅ Security initialization complete');
        } catch (err) {
          logError('Security startup failed', err);
        }
      }
    };

    init();

    return () => {
      try {
        securityMonitor.stop();
        cleanupTimers();
      } catch (err) {
        logError('Security cleanup error', err);
      }
    };
  }, [checkAuthStatus, cleanupTimers, securityConfig]);

  const logout = useCallback(() => {
    removeToken();
    removeRefreshToken();
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
  }, [navigate]);

  const value = useMemo(
    () => ({
      user,
      loggedIn,
      loading,
      error,
      status,
      sessionExpiry,
      authLevel,
      securityFlags,
      refreshToken: handleTokenRefresh,
      checkAuthStatus,
      resetInactivityTimer,
      logout,
    }),
    [
      user,
      loggedIn,
      loading,
      error,
      status,
      sessionExpiry,
      authLevel,
      securityFlags,
      handleTokenRefresh,
      checkAuthStatus,
      resetInactivityTimer,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
  securityConfig: PropTypes.object,
  onSecurityEvent: PropTypes.func,
};

export default AuthProvider;
