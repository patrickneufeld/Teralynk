// ✅ FILE: /frontend/src/hooks/useSecrets.js

import { useContext } from 'react';
import { useSecrets as useSecretsContext, SECRET_STATUS } from '@/contexts/SecretsContext';

/**
 * Hook: useSecrets
 * 
 * Wrapper around SecretsContext with enhanced validations.
 * 
 * @returns {{
 *   secrets: object,
 *   loading: boolean,
 *   error: Error|null,
 *   getSecret: (key: string) => string,
 *   updateSecrets: (newSecrets: object) => Promise<void>,
 *   clearSecrets: () => Promise<void>,
 *   revokeSecret: (key: string) => Promise<void>,
 *   rotateSecret: (key: string, newValue: string) => Promise<void>,
 *   exportSecrets: () => Promise<string>,
 *   importSecrets: (encryptedString: string) => Promise<void>,
 *   lastUpdated: string|null,
 *   status: object
 * }}
 */
export const useSecrets = () => {
  const context = useSecretsContext();

  if (!context) {
    throw new Error('useSecrets must be used inside a <SecretsProvider>');
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
   * Safely retrieve a secret by key.
   */
  const safeGetSecret = (key) => {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid secret key');
    }
    if (!secrets[key]) {
      throw new Error(`Secret "${key}" not found`);
    }
    if (status[key] !== SECRET_STATUS.VALID) {
      throw new Error(`Secret "${key}" is not valid: ${status[key]}`);
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

// Re-export SECRET_STATUS for convenience
export { SECRET_STATUS };

// Export both as named export and default
export default useSecrets;
