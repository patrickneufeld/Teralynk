// File Path: /Users/patrick/Projects/Teralynk/frontend/src/services/authService.js

const API_URL = "http://localhost:5001/api/auth";

export const loginUser = async (username, password) => {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Login failed");

        localStorage.setItem("accessToken", data.accessToken);
        return data;
    } catch (error) {
        console.error("Login Error:", error);
        return null;
    }
};

export const logoutUser = async () => {
    localStorage.removeItem("accessToken");
};
