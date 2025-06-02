// ✅ File: /frontend/src/actions/authActions.js

import { toast } from "react-toastify";
import {
  login,
  logout,
  refreshAuthToken,
  forgotPassword,
  confirmForgotPassword,
  signup,
  confirmSignup,
  getStatus,
} from "../api/authApi"; // ✅ named imports

import {
  createActivityLog,
  normalizeUserData,
  getClientId,
  getSessionId,
  validateUserData,
} from "../utils/authUtils";

import {
  getToken,
  setToken,
  setRefreshToken,
  setIdToken,
  decodeToken,
  getRefreshToken,
  removeAllTokens,
} from "../utils/tokenUtils";

import apiClient from "../api/apiClient";
import logger from "../utils/logging";

const log = logger.createLogger("authActions");

// ✅ Validate and apply all tokens
const validateAndSetTokens = (authResult) => {
  if (
    !authResult?.AccessToken ||
    !authResult?.RefreshToken ||
    !authResult?.IdToken
  ) {
    throw new Error("Invalid token data received");
  }

  try {
    setToken(authResult.AccessToken, authResult.ExpiresIn);
    setRefreshToken(authResult.RefreshToken);
    setIdToken(authResult.IdToken);
    return decodeToken(authResult.AccessToken);
  } catch (error) {
    throw new Error(`Token management failed: ${error.message}`);
  }
};

// ✅ Refresh token interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const refreshed = await refreshAuthToken();
        if (refreshed?.AccessToken) {
          validateAndSetTokens(refreshed);
          error.config.headers.Authorization = `Bearer ${refreshed.AccessToken}`;
          return apiClient.request(error.config);
        }
      } catch (refreshError) {
        log.error("Token refresh failed:", refreshError);
        throw new Error("Session expired. Please login again.");
      }
    }
    return Promise.reject(error);
  }
);

// ✅ Error mapping
const ERROR_MESSAGES = {
  InvalidPasswordException: "Incorrect password",
  UserNotFoundException: "User not found",
  NotAuthorizedException: "Invalid credentials",
  NetworkError: "Network connection error",
  default: "Login failed. Please try again.",
};

// ✅ Retry logic for user metadata fetch
const fetchUserDataWithRetry = async (userId, accessToken, retryCount = 0) => {
  try {
    const [servicesRes, settingsRes, permissionsRes] = await Promise.all([
      apiClient.get(`/users/${userId}/services`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 5000,
      }),
      apiClient.get(`/users/${userId}/settings`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 5000,
      }),
      apiClient.get(`/users/${userId}/permissions`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 5000,
      }),
    ]);

    return {
      services: servicesRes.data.services,
      settings: settingsRes.data.settings,
      permissions: permissionsRes.data.permissions,
    };
  } catch (error) {
    if (retryCount < 2 && error.response?.status === 401) {
      const refreshed = await refreshAuthToken();
      if (refreshed?.AccessToken) {
        return fetchUserDataWithRetry(
          userId,
          refreshed.AccessToken,
          retryCount + 1
        );
      }
    }
    throw error;
  }
};

// ✅ Update auth state and proceed
const updateStateAndNavigate = async (
  dispatch,
  userData,
  userDataResult,
  sessionExpiry
) => {
  return new Promise((resolve) => {
    dispatch({
      type: "LOGIN_SUCCESS",
      payload: {
        user: userData,
        services: userDataResult.services,
        settings: userDataResult.settings,
        permissions: userDataResult.permissions,
        sessionExpiry,
      },
      callback: resolve,
    });
  });
};

// ✅ LOGIN
export const handleLogin = async (dispatch, email, password, navigate) => {
  log.info("Login attempt", { email: email.substring(0, 3) + "***" });
  dispatch({ type: "SET_LOADING", loading: true });
  dispatch({ type: "CLEAR_ERROR" });

  try {
    const authResult = await login(email, password);
    const tokenData = await validateAndSetTokens(authResult);
    const sessionExpiry = new Date(tokenData.exp * 1000);

    const userResponse = await apiClient.get("/users/profile", {
      headers: { Authorization: `Bearer ${authResult.AccessToken}` },
      timeout: 5000,
    });

    const userData = normalizeUserData(userResponse.data);
    validateUserData(userData);

    const userDataResult = await fetchUserDataWithRetry(
      userData.id,
      authResult.AccessToken
    );

    localStorage.setItem(
      "user",
      JSON.stringify({
        id: userData.id,
        email: userData.email,
        role: userData.role,
        name: userData.name || userData.displayName || email.split("@")[0],
        lastLogin: new Date().toISOString(),
      })
    );

    await updateStateAndNavigate(dispatch, userData, userDataResult, sessionExpiry);
    await new Promise((resolve) => setTimeout(resolve, 100));

    await createActivityLog({
      userId: userData.id,
      event: "LOGIN",
      metadata: {
        email: userData.email,
        clientId: getClientId(),
        sessionId: getSessionId(),
        timestamp: new Date().toISOString(),
      },
    });

    navigate("/dashboard");
    toast.success("✅ Login successful!");
    log.info("Login successful", { userId: userData.id });

    return userData;
  } catch (error) {
    const errorDetails = {
      context: "login",
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      clientId: getClientId(),
      sessionId: getSessionId(),
      errorCode: error.code,
    };

    log.error("Login failed:", errorDetails);
    dispatch({
      type: "SET_ERROR",
      error: ERROR_MESSAGES[error.code] || ERROR_MESSAGES.default,
      errorDetails,
    });

    toast.error(`❌ ${ERROR_MESSAGES[error.code] || ERROR_MESSAGES.default}`);
    throw error;
  } finally {
    dispatch({ type: "SET_LOADING", loading: false });
  }
};

// ✅ LOGOUT
export const handleLogout = async (dispatch, user, navigate) => {
  log.info("Initiating logout", { userId: user?.id });
  dispatch({ type: "SET_LOADING", loading: true });

  try {
    if (user?.id) {
      await createActivityLog({
        userId: user.id,
        event: "LOGOUT",
        metadata: {
          email: user.email,
          clientId: getClientId(),
          sessionId: getSessionId(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    await Promise.race([
      logout(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Logout timeout")), 5000)
      ),
    ]);

    removeAllTokens();
    localStorage.removeItem("user");

    dispatch({ type: "LOGOUT" });
    toast.success("✅ Logged out successfully");
    log.info("Logout successful");
  } catch (error) {
    log.error("Logout error:", error);
    toast.error("❌ Logout error");
  } finally {
    dispatch({ type: "SET_LOADING", loading: false });
    navigate("/login");
  }
};

// ✅ Refresh session
export const handleSessionRefresh = async (dispatch) => {
  try {
    const refreshed = await refreshAuthToken();
    if (refreshed?.AccessToken) {
      const tokenData = await validateAndSetTokens(refreshed);
      const sessionExpiry = new Date(tokenData.exp * 1000);

      dispatch({
        type: "UPDATE_SESSION",
        sessionExpiry,
        timestamp: new Date().toISOString(),
      });

      return true;
    }
    return false;
  } catch (error) {
    log.error("Session refresh failed:", error);
    dispatch({ type: "LOGOUT" });
    toast.error("Session expired. Please login again.");
    return false;
  }
};

// ✅ Validate current session
export const validateSession = async () => {
  try {
    const currentToken = getToken();
    if (!currentToken) return false;

    await apiClient.get("/auth/validate", {
      headers: { Authorization: `Bearer ${currentToken}` },
      timeout: 3000,
    });

    return true;
  } catch (error) {
    log.error("Session validation failed:", error);
    return false;
  }
};

export default {
  handleLogin,
  handleLogout,
  handleSessionRefresh,
  validateSession,
};
