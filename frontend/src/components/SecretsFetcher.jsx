import React, { useEffect, useState, createContext, useContext } from "react";

// Context to hold secrets
const SecretsContext = createContext();

// Hook to access secrets anywhere in the app
export const useSecrets = () => {
  const context = useContext(SecretsContext);
  if (!context) {
    throw new Error("useSecrets must be used within a SecretsProvider");
  }
  return context;
};

// Keys expected from the backend (Including XAI_API_KEY)
const REQUIRED_SECRETS = [
  "COGNITO_USER_POOL_ID",
  "COGNITO_CLIENT_ID",
  "AWS_REGION",
  "FRONTEND_URL",
  "X_AI_API_KEY"
];

// Component to fetch and provide secrets
const SecretsFetcher = ({ children }) => {
  const [secrets, setSecrets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);  // Track if we're retrying fetch

  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

  const validateSecrets = (data) => {
    const missing = REQUIRED_SECRETS.filter((key) => !data[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required secrets: ${missing.join(", ")}`);
    }
  };

  const fetchWithRetry = async (retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`📡 Attempt ${attempt}: Fetching secrets from ${backendURL}/api/secrets`);
        const response = await fetch(`${backendURL}/api/secrets`);
        if (!response.ok) {
          throw new Error(`Failed to fetch secrets. Status: ${response.status}`);
        }

        const data = await response.json();
        validateSecrets(data);

        // Cache secrets in sessionStorage for faster access
        sessionStorage.setItem("secrets", JSON.stringify(data));
        console.log("✅ Secrets fetched and cached:", data);
        return data;
      } catch (err) {
        console.error(`❌ Error fetching secrets (Attempt ${attempt}):`, err.message);
        if (attempt === retries) throw err;
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
  };

  useEffect(() => {
    const loadSecrets = async () => {
      try {
        const cached = sessionStorage.getItem("secrets");
        if (cached) {
          const parsed = JSON.parse(cached);
          validateSecrets(parsed);
          setSecrets(parsed);
          console.log("✅ Loaded secrets from sessionStorage.");
          return;
        }

        setRetrying(true);  // Indicate we are retrying
        const fetched = await fetchWithRetry();
        console.log("✅ Fetched secrets:", fetched);
        setSecrets(fetched);
      } catch (err) {
        console.warn("⚠️ Error fetching secrets:", err);
        setError("Unable to load secrets. Please check your backend and try again.");
      } finally {
        setLoading(false);
        setRetrying(false);  // Stop retrying
      }
    };

    loadSecrets();
  }, []);

  if (loading) return <div>🔐 Loading secrets... Please wait.</div>;
  if (error) return <div className="error-message">❌ {error}</div>;

  return (
    <SecretsContext.Provider value={secrets}>
      {children}
    </SecretsContext.Provider>
  );
};

export default SecretsFetcher;
