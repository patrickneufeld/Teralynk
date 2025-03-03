// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/api/authApi.js

import apiClient from "../../../../frontend/src/api/apiClient";

/**
 * ✅ User Signup
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} name - User full name
 */
export const signup = async (email, password, name) => {
    try {
        const response = await apiClient.post("/auth/signup", { email, password, name }, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error("❌ Signup Error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error || "Signup failed.");
    }
};

/**
 * ✅ Confirm User Signup (for Email Verification)
 * @param {string} username - Cognito username
 * @param {string} confirmationCode - Code received via email
 */
export const confirmSignup = async (username, confirmationCode) => {
    try {
        const response = await apiClient.post("/auth/confirm-signup", { username, confirmationCode }, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error("❌ Confirm Signup Error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error || "Signup confirmation failed.");
    }
};

/**
 * ✅ User Login
 * @param {string} email - User email
 * @param {string} password - User password
 */
export const login = async (email, password) => {
    try {
        const response = await apiClient.post("/auth/login", { email, password }, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error("❌ Login Error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error || "Login failed. Please check your credentials.");
    }
};

/**
 * ✅ Logout User & Clear Session
 */
export const logout = async () => {
    try {
        const response = await apiClient.post("/auth/logout", {}, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error("❌ Logout Error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error || "Logout failed.");
    }
};

/**
 * ✅ Get Authentication Status
 */
export const getStatus = async () => {
    try {
        const response = await apiClient.get("/auth/status", { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error("❌ Auth Status Error:", error.response?.data || error.message);
        throw new Error("Failed to retrieve authentication status.");
    }
};

/**
 * ✅ Automatically Refresh Authentication Token
 */
export const refreshAuthToken = async () => {
    try {
        const response = await apiClient.post("/auth/refresh", {}, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error("❌ Token Refresh Error:", error.response?.data || error.message);
        throw new Error("Failed to refresh authentication token.");
    }
};
