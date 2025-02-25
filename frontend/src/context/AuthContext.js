// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/context/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = async (username, password) => {
        try {
            const response = await api.post("/auth/login", { username, password });
            const userData = {
                username,
                accessToken: response.data.accessToken,
                idToken: response.data.idToken,
                refreshToken: response.data.refreshToken,
            };
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
            navigate("/dashboard"); // Redirect after login
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem("user");
        setUser(null);
        navigate("/login");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
