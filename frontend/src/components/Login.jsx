// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/Login.jsx

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import awsConfig from "../utils/awsConfig";
import { GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import "../styles/components/Login.css";

const { cognitoClient, secretsClient } = awsConfig;

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [userPoolClientId, setUserPoolClientId] = useState(null);
    const navigate = useNavigate();

    // ✅ Fetch Cognito App Client ID from Secrets Manager
    useEffect(() => {
        const fetchSecret = async () => {
            try {
                console.log("🔍 Retrieving Cognito App Client ID...");
                const command = new GetSecretValueCommand({ SecretId: "Teralynk_Cognito" });
                const response = await secretsClient.send(command);
                const secretData = response.SecretString ? JSON.parse(response.SecretString) : null;

                if (!secretData || !secretData.userPoolClientId) {
                    throw new Error("❌ Missing Cognito App Client ID in secrets.");
                }

                setUserPoolClientId(secretData.userPoolClientId);
                console.log("✅ Cognito App Client ID Loaded:", secretData.userPoolClientId);
            } catch (err) {
                console.error("❌ Failed to retrieve Cognito App Client ID:", err);
                setError("Failed to load authentication settings. Check AWS credentials.");
            }
        };

        fetchSecret();
    }, []);

    // ✅ Handle Login
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        // 🔍 Validate Inputs
        if (!email || !password) {
            setError("⚠️ Please enter both email and password.");
            setLoading(false);
            return;
        }

        if (!userPoolClientId) {
            setError("Cognito App Client ID is missing. Cannot proceed.");
            setLoading(false);
            return;
        }

        try {
            const command = new InitiateAuthCommand({
                AuthFlow: "USER_PASSWORD_AUTH",
                ClientId: userPoolClientId,
                AuthParameters: {
                    USERNAME: email,
                    PASSWORD: password,
                },
            });

            const response = await cognitoClient.send(command);

            if (!response.AuthenticationResult) {
                throw new Error("Invalid credentials or authentication failed.");
            }

            // ✅ Securely Store Authentication Tokens in HttpOnly Cookies
            document.cookie = `idToken=${response.AuthenticationResult.IdToken}; Secure; HttpOnly; SameSite=Strict; Path=/`;
            document.cookie = `accessToken=${response.AuthenticationResult.AccessToken}; Secure; HttpOnly; SameSite=Strict; Path=/`;
            document.cookie = `refreshToken=${response.AuthenticationResult.RefreshToken}; Secure; HttpOnly; SameSite=Strict; Path=/`;

            console.log("✅ Authentication Successful:", response.AuthenticationResult);

            onLogin(response.AuthenticationResult); // Pass user data to parent
            navigate("/dashboard"); // Redirect to dashboard
        } catch (err) {
            console.error("❌ Cognito Login Error:", err);
            setError(err.message || "⚠️ Login failed. Please check your credentials and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            {error && <div className="error-message">⚠️ {error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="login-button" disabled={loading || !userPoolClientId}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
        </div>
    );
};

Login.propTypes = {
    onLogin: PropTypes.func.isRequired,
};

export default Login;
