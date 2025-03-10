// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/context/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../utils/api"; // Must exist and handle base URL
import { useSecrets } from "../components/SecretsFetcher";

// ✅ Create Auth Context
const AuthContext = createContext();

// ✅ Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const secrets = useSecrets();

  // ✅ Validate token and user status
  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setUser(null);
        setLoggedIn(false);
        return;
      }

      const response = await apiRequest("/auth/me", "GET", null, token);
      if (response?.user) {
        setUser(response.user);
        setLoggedIn(true);
      } else {
        localStorage.removeItem("authToken");
        setUser(null);
        setLoggedIn(false);
      }
    } catch (err) {
      console.error("❌ Auth check failed:", err);
      setUser(null);
      setLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Login Handler
  const login = async (email, password) => {
    try {
      const response = await apiRequest("/auth/login", "POST", { email, password });
      if (response?.token) {
        localStorage.setItem("authToken", response.token);
        setUser(response.user);
        setLoggedIn(true);
        navigate("/dashboard");
      } else {
        throw new Error(response?.error || "Login failed");
      }
    } catch (err) {
      console.error("❌ Login Error:", err);
      throw err;
    }
  };

  // ✅ Logout Handler
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
    setLoggedIn(false);
    navigate("/login");
  };

  // ✅ Check auth on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loggedIn,
        loading,
        login,
        handleLogout,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Custom hook for consuming auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
