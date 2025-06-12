// ✅ FILE: /frontend/src/hooks/useSecrets.js
// Unified Secrets Hook + Provider for managing secure config secrets

import React, { useContext } from 'react';
import {
  SecretsContext,
  SecretsProvider as ContextProvider,
  SECRET_STATUS
} from "@/contexts";

/**
 * Custom Hook: useSecrets
 * 
 * Provides reactive access to the secure secrets context, enabling read/write operations,
 * error handling, secret rotation, and external sync via export/import.
 * 
 * @returns {{
 *   secrets: Record<string, { value: string, createdAt?: string, metadata?: object }>,
 *   loading: boolean,
 *   error: Error|null,
 *   getSecret: (key: string) => string,
 *   updateSecrets: (newSecrets: Record<string, { value: string }>) => Promise<void>,
 *   clearSecrets: () => Promise<void>,
 *   revokeSecret: (key: string) => Promise<void>,
 *   rotateSecret: (key: string, newValue: string) => Promise<void>,
 *   exportSecrets: () => Promise<string>,
 *   importSecrets: (encryptedString: string) => Promise<void>,
 *   lastUpdated: string|null,
 *   status: Record<string, string>
 * }}
 */
export const useSecrets = () => {
  const context = useContext(SecretsContext);

  if (!context) {
    throw new Error('❌ useSecrets must be used within a <SecretsProvider>');
  }

  const {
    secrets,
    updateSecrets,
    clearSecrets,
    getSecret,
    revokeSecret,
    rotateSecret,
    exportSecrets,
    importSecrets,
    loading,
    error,
    lastUpdated,
    status,
  } = context;

  /**
   * Safely retrieve a secret by key with validation
   * @param {string} key
   * @returns {string}
   */
  const safeGetSecret = (key) => {
    if (!key || typeof key !== 'string') {
      throw new Error('❌ Invalid secret key');
    }
    if (!secrets?.[key]) {
      throw new Error(`❌ Secret "${key}" not found`);
    }
    if (status?.[key] !== SECRET_STATUS.VALID) {
      throw new Error(`❌ Secret "${key}" is not valid: ${status[key]}`);
    }
    return secrets[key].value;
  };

  return {
    secrets,
    loading,
    error,
    getSecret: safeGetSecret,
    updateSecrets,
    clearSecrets,
    revokeSecret,
    rotateSecret,
    exportSecrets,
    importSecrets,
    lastUpdated,
    status,
  };
};

/**
 * ✅ Context Provider: <SecretsProvider>
 * Used in main.jsx to wrap the application.
 */
export const SecretsProvider = ContextProvider;

/**
 * ✅ Enum export for status usage in components
 */
export { SECRET_STATUS };

/**
 * ✅ Default export
 */
export default useSecrets;
