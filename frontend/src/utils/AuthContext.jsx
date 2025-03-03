// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/context/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../utils/api"; // Ensure this file exists

// ✅ Create Auth Context
const AuthContext = createContext();

// ✅ Auth Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // ✅ Check Auth Status
    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setLoggedIn(false);
                setUser(null);
                setLoading(false);
                return;
            }

            const response = await apiRequest("/auth/me", "GET", null, token);
            if (response.user) {
                setUser(response.user);
                setLoggedIn(true);
            } else {
                localStorage.removeItem("token");
                setLoggedIn(false);
                setUser(null);
            }
        } catch (error) {
            console.error("❌ Error checking auth status:", error);
            setLoggedIn(false);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Handle Login
    const login = async (email, password) => {
        try {
            const response = await apiRequest("/auth/login", "POST", { email, password });
            if (response.token) {
                localStorage.setItem("token", response.token);
                setUser(response.user);
                setLoggedIn(true);
                navigate("/dashboard");
            } else {
                throw new Error(response.error || "Login failed");
            }
        } catch (error) {
            console.error("❌ Login Error:", error);
            throw error;
        }
    };

    // ✅ Handle Logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        setUser(null);
        setLoggedIn(false);
        navigate("/login");
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loggedIn, loading, checkAuthStatus, login, handleLogout }}>
            {children}
        </AuthContext.Provider>
    );
};

// ✅ Custom Hook to Use Auth
export const useAuth = () => useContext(AuthContext);

