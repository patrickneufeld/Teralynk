// ✅ FILE: frontend/src/context/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    CognitoIdentityProviderClient,
    GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { getToken, removeToken, setToken } from "../utils/auth"; // ✅ Import Token Helpers
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

// ✅ AWS Configuration
const region = "us-east-1";
const secretsClient = new SecretsManagerClient({ region });
const cognitoClient = new CognitoIdentityProviderClient({ region });

// ✅ Create Authentication Context
const AuthContext = createContext();

// ✅ Authentication Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userPoolClientId, setUserPoolClientId] = useState(null);
    const navigate = useNavigate();

    /**
     * ✅ Fetch Cognito App Client ID from AWS Secrets Manager
     */
    useEffect(() => {
        const fetchSecret = async () => {
            try {
                console.log("🔍 Retrieving Cognito App Client ID...");
                const command = new GetSecretValueCommand({ SecretId: "Teralynk_Cognito" });
                const response = await secretsClient.send(command);
                const secretData = response.SecretString ? JSON.parse(response.SecretString) : null;

                if (!secretData?.userPoolClientId) {
                    throw new Error("❌ Missing Cognito App Client ID in secrets.");
                }

                setUserPoolClientId(secretData.userPoolClientId);
                console.log("✅ Cognito App Client ID Loaded:", secretData.userPoolClientId);
            } catch (err) {
                console.error("❌ Failed to retrieve Cognito App Client ID:", err);
            }
        };

        fetchSecret();
    }, []);

    /**
     * ✅ Check Authentication Status & Fetch User Data
     */
    const checkAuthStatus = async () => {
        try {
            const accessToken = getToken();
            if (!accessToken) {
                console.warn("⚠️ No authentication token found.");
                setLoggedIn(false);
                setUser(null);
                setLoading(false);
                return;
            }

            console.log("🔍 Verifying user authentication with Cognito...");
            const command = new GetUserCommand({ AccessToken: accessToken });
            const response = await cognitoClient.send(command);

            if (!response || !response.Username) {
                throw new Error("Authentication failed: Invalid token.");
            }

            setUser({
                username: response.Username,
                email: response.UserAttributes.find(attr => attr.Name === "email")?.Value || "N/A",
            });
            setLoggedIn(true);
        } catch (error) {
            console.error("❌ Authentication verification failed:", error);
            removeToken();
            setLoggedIn(false);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    /**
     * ✅ Handle User Logout
     */
    const handleLogout = () => {
        console.log("🚪 Logging out user...");
        removeToken();
        setUser(null);
        setLoggedIn(false);
        navigate("/login");
    };

    /**
     * ✅ Automatically Check Authentication on Component Mount
     */
    useEffect(() => {
        checkAuthStatus();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loggedIn, loading, checkAuthStatus, handleLogout }}>
            {children}
        </AuthContext.Provider>
    );
};

// ✅ Custom Hook to Use Authentication Context
export const useAuth = () => useContext(AuthContext);
