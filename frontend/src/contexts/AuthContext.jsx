// ================================================
// ✅ FILE: /frontend/src/contexts/AuthContext.jsx
// Hardened React Auth Context with Security Events
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
import { toast } from 'react-toastify';

import api from '@/api/apiClient';
import { authReducer, initialState, AUTH_ACTIONS } from '@/reducers/authReducer';
import { SECURITY_POLICIES } from '@/constants/auth';
import { logInfo, logError, logWarn } from '@/utils/logging';
import { SECURITY_EVENTS, emitSecurityEvent } from '@/utils/security/eventEmitter';
import secureStorage from '@/utils/security/secureStorage';
import * as tokenManager from '@/utils/tokenManager';
import { getRawDeviceId } from '@/utils/security/deviceUtils';
import { hashSHA256 } from '@/utils/encryption';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();
  const initialized = useRef(false);

  const validateSession = useCallback(async () => {
    try {
      const token = await tokenManager.getToken();
      if (!token) throw new Error('Missing token');

      const session = await api.get('/auth/session');
      if (!session.data || !session.data.user) {
        throw new Error('Invalid session data');
      }
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: session.data.user });
      logInfo('✅ Session validated', session.data);
    } catch (err) {
      logWarn('Session validation failed', { error: err.message });
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, []);

  const login = useCallback(async (email, password, options = {}) => {
    try {
      logInfo('Login attempt', { email, hasOptions: !!options });

      const clientSecret = import.meta.env.VITE_COGNITO_CLIENT_SECRET;
      const secretHash = clientSecret ? await hashSHA256(clientSecret) : null;

      const credentials = {
        email,
        password,
        ...options,
        secret_hash: secretHash,
      };

      const response = await api.post('/auth/login', credentials, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      const { token, user } = response.data;
      await tokenManager.setToken(token);
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: user });
      emitSecurityEvent(SECURITY_EVENTS.LOGIN_SUCCESS, { user });
      
      // Add a small delay before navigation to ensure state is updated
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
      
      return { success: true, user };
    } catch (err) {
      emitSecurityEvent(SECURITY_EVENTS.LOGIN_FAILURE, { reason: err.message });
      logError('❌ Login failed', err);

      const errorMessage = err.response?.data?.error || err.response?.data?.message || "Login failed. Please try again.";
      toast.error(errorMessage);

      throw err;
    }
  }, [navigate]);

  const loginWithProvider = useCallback(async (provider, token) => {
    try {
      logInfo(`Social login attempt with ${provider}`);

      const response = await api.post('/auth/social-login', {  // Ensure this endpoint exists
        provider,
        token,
        deviceId: getRawDeviceId(),
      });

      const { token: authToken, user } = response.data;
      await tokenManager.setToken(authToken);
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: user });
      emitSecurityEvent(SECURITY_EVENTS.LOGIN_SUCCESS, { user, provider });
      return { success: true, user };
    } catch (err) {
      emitSecurityEvent(SECURITY_EVENTS.LOGIN_FAILURE, { reason: err.message, provider });
      logError(`❌ ${provider} login failed`, err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || `${provider} login failed. Please try again.`;
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (state.loggedIn) {
        try {
          await api.post('/auth/logout'); // Ensure this endpoint exists
        } catch (apiErr) {
          logWarn('API logout failed, continuing with local logout', apiErr);
        }
      }

      await tokenManager.clearTokens();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      emitSecurityEvent(SECURITY_EVENTS.LOGOUT);
      navigate('/login');
    } catch (err) {
      logError('❌ Logout failed', err);
      toast.error("Logout failed. Please try again.");
    }
  }, [navigate, state.loggedIn]);

  useEffect(() => {
    if (!initialized.current) {
      validateSession();
      initialized.current = true;
    }
  }, [validateSession]);

  // Debug output for authentication state
  useEffect(() => {
    console.log("Auth Context State:", {
      loggedIn: state.loggedIn,
      user: state.user,
      loading: state.loading,
      initialized: state.initialized
    });
  }, [state]);

  const contextValue = useMemo(() => ({
    ...state,
    login,
    loginWithProvider,
    logout,
    dispatch,
    securityPolicies: SECURITY_POLICIES,
    rawDeviceId: getRawDeviceId(),
    validateSession,
  }), [state, login, loginWithProvider, logout, dispatch, validateSession]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('❌ useAuth() must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
