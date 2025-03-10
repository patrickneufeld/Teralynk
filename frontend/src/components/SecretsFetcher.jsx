// /Users/patrick/Projects/Teralynk/frontend/src/components/SecretsFetcher.jsx

import React, { useEffect, useState, createContext, useContext } from "react";

const SecretsContext = createContext();

export const useSecrets = () => {
  const context = useContext(SecretsContext);
  if (!context) {
    throw new Error("useSecrets must be used within a SecretsProvider");
  }
  return context;
};

const SecretsFetcher = ({ children }) => {
  const [secrets, setSecrets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const MAX_RETRIES = 3;
  const API_URL = "http://localhost:5001/api/secrets/teralynk/env";

  const REQUIRED_SECRETS = [
    "VITE_API_URL",
    "FRONTEND_URL",
    "VITE_COGNITO_USER_POOL_ID",
    "VITE_COGNITO_CLIENT_ID",
    "VITE_AWS_REGION",
  ];

  const DEFAULT_SECRETS = {
    VITE_API_URL: "http://localhost:5001",
    FRONTEND_URL: "http://localhost:5173",
    VITE_AWS_REGION: "us-east-1",
    VITE_COGNITO_USER_POOL_ID: "mock-pool",
    VITE_COGNITO_CLIENT_ID: "mock-client",
  };

  const validateSecrets = (secrets) => {
    const missing = REQUIRED_SECRETS.filter((key) => !secrets[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required secrets: ${missing.join(", ")}`);
    }
  };

  useEffect(() => {
    const fetchSecrets = async () => {
      setLoading(true);
      try {
        const cached = sessionStorage.getItem("secrets");
        if (cached) {
          const parsed = JSON.parse(cached);
          validateSecrets(parsed);
          setSecrets(parsed);
          console.log("✅ Loaded secrets from sessionStorage cache.");
          return;
        }

        const response = await fetch(API_URL, {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch secrets. Status: ${response.status}`);
        }

        const data = await response.json();
        validateSecrets(data);
        sessionStorage.setItem("secrets", JSON.stringify(data));
        setSecrets(data);
        console.log("✅ Secrets fetched and stored:", data);
      } catch (err) {
        console.error(`❌ Fetch secrets failed:`, err.message);
        setSecrets(DEFAULT_SECRETS);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSecrets();
  }, []);

  if (loading) return <div>🔐 Loading secrets...</div>;

  return (
    <SecretsContext.Provider value={secrets}>
      {children}
    </SecretsContext.Provider>
  );
};

export default SecretsFetcher;
