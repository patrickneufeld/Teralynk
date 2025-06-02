// ✅ FILE: /frontend/src/components/SecretsFetcher.jsx

import React, { createContext, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { logError, logInfo } from '@/utils/logging/logging';

// Create context for secrets
const SecretsContext = createContext(null);

/**
 * useSecrets — hook to access loaded secrets
 * @returns {object} Secrets object from context
 */
export const useSecrets = () => {
  const context = useContext(SecretsContext);
  if (!context) {
    throw new Error("❌ useSecrets must be used within <SecretsFetcher>");
  }
  return context;
};

/**
 * SecretsFetcher — loads secrets and provides them via context
 *
 * Fetches secrets from environment or remote API and wraps children with context
 */
const SecretsFetcher = ({ children }) => {
  const [secrets, setSecrets] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSecrets = async () => {
      try {
        setLoading(true);
        
        // 🔐 Static Vite secrets from environment
        const localSecrets = {
          VITE_COGNITO_CLIENT_ID: import.meta.env.VITE_COGNITO_CLIENT_ID,
          VITE_COGNITO_USER_POOL_ID: import.meta.env.VITE_COGNITO_USER_POOL_ID,
          VITE_AWS_REGION: import.meta.env.VITE_AWS_REGION,
          VITE_RECAPTCHA_SITE_KEY: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
          VITE_ENCRYPTION_SECRET: import.meta.env.VITE_ENCRYPTION_SECRET,
          VITE_API_URL: import.meta.env.VITE_API_URL,
        };

        // Validate required secrets
        const requiredSecrets = [
          'VITE_COGNITO_CLIENT_ID',
          'VITE_COGNITO_USER_POOL_ID',
          'VITE_AWS_REGION',
          'VITE_API_URL'
        ];

        const missingSecrets = requiredSecrets.filter(key => !localSecrets[key]);
        if (missingSecrets.length > 0) {
          throw new Error(`Missing required secrets: ${missingSecrets.join(', ')}`);
        }

        // Optional: Add API fetch fallback logic here if remote secrets needed
        // const response = await fetch("/api/secrets");
        // const remoteSecrets = await response.json();

        setSecrets(localSecrets);
        logInfo("✅ Secrets loaded successfully");
      } catch (err) {
        logError("❌ Failed to load secrets:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadSecrets();
  }, []);

  // Provide loading state and error handling functions to consumers
  const contextValue = {
    ...secrets,
    loading,
    error,
    isLoaded: !loading && !error,
    refresh: async () => {
      setLoading(true);
      setError(null);
      try {
        // Implement refresh logic here
        logInfo("🔄 Refreshing secrets");
      } catch (err) {
        logError("❌ Failed to refresh secrets:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }
  };

  if (error) {
    return (
      <div className="secrets-error p-4 bg-red-50 border border-red-200 rounded" role="alert">
        <h3 className="text-red-700 font-semibold">Error Loading Configuration</h3>
        <p className="text-red-600 text-sm">{error.message || "Unable to load application secrets."}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="secrets-loading flex items-center justify-center p-4">
        <div className="animate-pulse text-gray-600">
          Loading application configuration...
        </div>
      </div>
    );
  }

  return (
    <SecretsContext.Provider value={contextValue}>
      {children}
    </SecretsContext.Provider>
  );
};

SecretsFetcher.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SecretsFetcher;
