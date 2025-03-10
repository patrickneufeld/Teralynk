// /frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CognitoIdentityProviderClient,
  GetUserCommand,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

import { getToken, setToken, removeToken } from "../utils/tokenUtils";
import { useSecrets } from "../components/SecretsFetcher"; // ✅ Secrets context

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const secrets = useSecrets(); // ✅ Load secrets from context
  const navigate = useNavigate();

  // ✅ Create Cognito client dynamically using secrets
  const cognitoClient = new CognitoIdentityProviderClient({
    region: secrets?.VITE_AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: secrets?.VITE_AWS_ACCESS_KEY_ID,
      secretAccessKey: secrets?.VITE_AWS_SECRET_ACCESS_KEY,
    },
  });

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      const accessToken = getToken();
      if (!accessToken) {
        setLoggedIn(false);
        setUser(null);
        return;
      }

      const command = new GetUserCommand({ AccessToken: accessToken });
      const response = await cognitoClient.send(command);

      if (response?.Username) {
        setUser({
          username: response.Username,
          email: response.UserAttributes.find(attr => attr.Name === "email")?.Value || "N/A",
        });
        setLoggedIn(true);
      } else {
        throw new Error("Invalid token");
      }
    } catch (err) {
      console.error("❌ Auth Check Failed:", err.message || err);
      removeToken();
      setUser(null);
      setLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      console.log("🔐 Logging in...");
      const command = new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: secrets?.VITE_COGNITO_CLIENT_ID,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      });

      const response = await cognitoClient.send(command);

      if (!response.AuthenticationResult) {
        throw new Error("Login failed: Invalid credentials.");
      }

      setToken(response.AuthenticationResult.AccessToken);
      setUser({ username });
      setLoggedIn(true);
      navigate("/dashboard");
      console.log("✅ Login successful");
    } catch (error) {
      console.error("❌ Login failed:", error.message || error);
      throw error;
    }
  };

  const handleLogout = () => {
    console.log("🚪 Logging out...");
    removeToken();
    setUser(null);
    setLoggedIn(false);
    navigate("/login");
  };

  useEffect(() => {
    if (secrets?.VITE_COGNITO_CLIENT_ID) {
      checkAuthStatus();
    }
  }, [secrets]);

  return (
    <AuthContext.Provider
      value={{ user, loggedIn, loading, login, handleLogout, checkAuthStatus }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
