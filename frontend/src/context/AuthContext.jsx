// File: /frontend/src/context/AuthContext.jsx

import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSecrets } from "../components/SecretsFetcher";
import {
  authenticateUser,
  fetchUserProfile,
  logoutUser,
  refreshSession,
} from "../utils/awsCognitoClient";
import {
  getToken,
  removeToken,
  getRefreshToken,
  setToken,
  setRefreshToken,
  removeRefreshToken,
} from "../utils/tokenUtils";

// Create Auth Context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const secrets = useSecrets();
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Login function
  const login = async (username, password) => {
    try {
      const result = await authenticateUser(username, password);
      if (result.AccessToken) {
        setToken(result.AccessToken, result.ExpiresIn);
        setRefreshToken(result.RefreshToken);
        const profile = await fetchUserProfile();
        setUser({
          username: profile.Username,
          email: profile.UserAttributes?.find(attr => attr.Name === "email")?.Value || "N/A",
        });
        setLoggedIn(true);
        navigate("/dashboard");
      } else {
        throw new Error("Login failed — no access token returned.");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setError("Login failed. Please check your credentials and try again.");
      throw err;
    }
  };

  // Check if the user is authenticated and handle token refresh
  const checkAuthStatus = async () => {
    setLoading(true);
    setError(null);  // Reset error when checking auth status
    try {
      const token = getToken();
      if (!token) {
        setLoggedIn(false);
        setUser(null);
        return;
      }

      const profile = await fetchUserProfile();
      setUser({
        username: profile.Username,
        email: profile.UserAttributes?.find(attr => attr.Name === "email")?.Value || "N/A",
      });
      setLoggedIn(true);
    } catch (err) {
      console.warn("⚠️ Token expired or invalid, attempting session refresh", err.message);
      try {
        const refreshed = await refreshSession();
        if (refreshed.AccessToken) {
          setToken(refreshed.AccessToken, refreshed.ExpiresIn);
          const profile = await fetchUserProfile();
          setUser({
            username: profile.Username,
            email: profile.UserAttributes?.find(attr => attr.Name === "email")?.Value || "N/A",
          });
          setLoggedIn(true);
        } else {
          throw new Error("Failed to refresh session");
        }
      } catch (refreshErr) {
        console.error("❌ Refresh session failed:", refreshErr);
        setError("Session expired, please log in again.");
        removeToken();
        removeRefreshToken();
        setLoggedIn(false);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn("⚠️ Logout error:", err);
      setError("Error during logout. Please try again.");
    } finally {
      removeToken();
      removeRefreshToken();
      setUser(null);
      setLoggedIn(false);
      navigate("/login");
    }
  };

  // Load user and authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loggedIn,
        loading,
        error,
        login,
        handleLogout,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access the AuthContext
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
