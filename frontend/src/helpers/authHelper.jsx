// ✅ File: frontend/src/helpers/authHelper.jsx

import React from "react";

// ✅ Reusable function for handling login
export const onLogin = (authResult) => {
    if (!authResult) {
        console.error("❌ Login failed: No authentication result provided.");
        return;
    }

    console.log("✅ Login successful:", authResult);

    // Example: Save tokens to localStorage or secure cookie
    localStorage.setItem("authToken", authResult.AuthenticationResult || "");
    localStorage.setItem("refreshToken", authResult.RefreshToken || "");

    // Redirect to dashboard or other authenticated area
    window.location.href = "/dashboard";
};

// ✅ Reusable function for handling logout
export const onLogout = () => {
    console.log("✅ User logged out successfully!");

    // Clear authentication tokens and reset user state
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");

    // Redirect to login page or show logout confirmation
    window.location.href = "/login";
};

// ✅ Mocked or real authentication API call
export const loginUser = async (username, password) => {
    if (!username || !password) {
        throw new Error("Username and password are required for authentication.");
    }

    try {
        console.log("🔄 Authenticating user:", username);

        // Replace this mock with your actual backend or AWS Cognito authentication API call
        const response = await fetch(process.env.REACT_APP_LOGIN_API || "/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Authentication failed!");
        }

        const data = await response.json();
        console.log("✅ Authentication response received:", data);

        return data;
    } catch (error) {
        console.error("❌ Login error:", error.message || error);
        throw new Error(error.message || "Authentication failed! Please try again.");
    }
};

// ✅ Helper function to check if the user is authenticated
export const isAuthenticated = () => {
    const token = localStorage.getItem("authToken");
    return !!token; // Returns true if token exists, false otherwise
};
