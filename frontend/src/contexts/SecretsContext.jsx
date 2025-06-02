// ✅ FILE: /frontend/src/contexts/SecretsContext.jsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";

import { createLogger } from "@/utils/logging/logging";
import { SecureStorage } from "@/utils/security/secureStorage";
import { generateTraceId } from "@/utils/logger";
import { encrypt, decrypt } from "@/utils/encryption";

// Create logger instance
const logger = createLogger('SecretsContext');

// Create SecureStorage instance
const secretsStorage = new SecureStorage({
  namespace: 'secrets.',
  version: '2.0.0',
  strict: true,
  autoInit: true,
});

// ✅ Constants
export const SECRET_TYPES = {
  API_KEY: "API_KEY",
  TOKEN: "TOKEN",
  PASSWORD: "PASSWORD",
  CERTIFICATE: "CERTIFICATE",
  SSH_KEY: "SSH_KEY",
  OTHER: "OTHER",
};

export const SECRET_STATUS = {
  VALID: "VALID",
  EXPIRED: "EXPIRED",
  REVOKED: "REVOKED",
  PENDING: "PENDING",
};

const STORAGE_KEY = "encrypted_secrets";

// ✅ Create and export context
export const SecretsContext = createContext(undefined);

// ✅ Hook to consume SecretsContext
export const useSecrets = () => {
  const context = useContext(SecretsContext);
  if (!context) {
    logger.error("useSecrets must be used within a SecretsProvider");
    throw new Error("useSecrets must be used within a SecretsProvider");
  }
  return context;
};

// ✅ Secret validator
const validateSecret = (secret, key = "") => {
  if (!secret || typeof secret !== "object") {
    throw new Error(`Invalid secret format for ${key}`);
  }

  const requiredFields = ["type", "value", "created", "expires"];
  requiredFields.forEach((field) => {
    if (!secret[field]) {
      throw new Error(`Missing '${field}' in secret ${key}`);
    }
  });

  if (!Object.values(SECRET_TYPES).includes(secret.type)) {
    throw new Error(`Invalid type in secret ${key}: ${secret.type}`);
  }

  if (typeof secret.value !== "string" || !secret.value.trim()) {
    throw new Error(`Empty or invalid value for ${key}`);
  }

  const created = new Date(secret.created);
  const expires = new Date(secret.expires);
  const now = new Date();

  if (isNaN(created.getTime())) {
    throw new Error(`Invalid created date for ${key}`);
  }

  if (isNaN(expires.getTime())) {
    throw new Error(`Invalid expires date for ${key}`);
  }

  if (expires <= now) {
    throw new Error(`Secret ${key} is expired`);
  }

  return true;
};

// ✅ SecretsProvider Implementation
export const SecretsProvider = ({ children }) => {
  const [secrets, setSecrets] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [status, setStatus] = useState({});

  const traceId = useMemo(() => generateTraceId(), []);

  // ✅ Load secrets from secure storage
  const loadSecretsFromStorage = useCallback(async () => {
    try {
      setLoading(true);
      const encrypted = await secretsStorage.getItem(STORAGE_KEY, { context: "secrets" });

      if (!encrypted || typeof encrypted !== "object") {
        logger.info("[SecretsContext] No secrets to load");
        setLoading(false);
        return;
      }

      const validSecrets = {};
      const newStatus = {};

      Object.entries(encrypted).forEach(([key, secret]) => {
        try {
          validateSecret(secret, key);
          validSecrets[key] = secret;
          newStatus[key] = SECRET_STATUS.VALID;
        } catch (err) {
          newStatus[key] = SECRET_STATUS.EXPIRED;
          logger.warn(`[SecretsContext] Secret "${key}" validation failed: ${err.message}`);
        }
      });

      setSecrets(validSecrets);
      setStatus(newStatus);
      setLastUpdated(new Date().toISOString());
      logger.info(`[SecretsContext] Loaded ${Object.keys(validSecrets).length} valid secrets`);
    } catch (err) {
      logger.error(`[SecretsContext] Failed to load secrets`, { err, traceId });
      setError(err);
      await secretsStorage.removeItem(STORAGE_KEY, { context: "secrets" });
    } finally {
      setLoading(false);
    }
  }, [traceId]);

  useEffect(() => {
    loadSecretsFromStorage();
  }, [loadSecretsFromStorage]);

  // ✅ Update secrets
  const updateSecrets = async (newSecrets) => {
    try {
      if (!newSecrets || typeof newSecrets !== "object") {
        throw new Error("Invalid secrets object");
      }

      Object.entries(newSecrets).forEach(([key, secret]) => {
        validateSecret(secret, key);
      });

      const updatedSecrets = { ...secrets, ...newSecrets };
      await secretsStorage.setItem(STORAGE_KEY, updatedSecrets, { context: "secrets" });

      setSecrets(updatedSecrets);
      setLastUpdated(new Date().toISOString());

      const newStatus = { ...status };
      Object.keys(newSecrets).forEach((key) => {
        newStatus[key] = SECRET_STATUS.VALID;
      });
      setStatus(newStatus);

      toast.success("✅ Secrets updated successfully");
      logger.info("[SecretsContext] Secrets updated", { traceId });
    } catch (err) {
      logger.error("[SecretsContext] Secret update failed", { err, traceId });
      toast.error(`❌ Update failed: ${err.message}`);
      throw err;
    }
  };

  // ✅ Get a single validated secret
  const getSecret = (key) => {
    try {
      if (!key || typeof key !== "string") throw new Error("Invalid key provided");
      const secret = secrets[key];
      if (!secret) throw new Error(`Secret "${key}" not found`);
      if (status[key] !== SECRET_STATUS.VALID) throw new Error(`Secret "${key}" is ${status[key]}`);
      return secret.value;
    } catch (err) {
      logger.warn(`[SecretsContext] getSecret failed for "${key}"`, { err, traceId });
      throw err;
    }
  };

  // ✅ Rotate a secret
  const rotateSecret = async (key, newValue) => {
    try {
      if (!secrets[key]) throw new Error(`Secret "${key}" not found`);

      const rotated = {
        ...secrets[key],
        previousValue: secrets[key].value,
        value: newValue,
        created: new Date().toISOString(),
        expires: new Date(Date.now() + 90 * 86400000).toISOString(), // 90 days
      };

      await updateSecrets({ [key]: rotated });

      toast.success(`✅ Secret "${key}" rotated`);
      logger.info(`[SecretsContext] Secret rotated`, { key, traceId });
    } catch (err) {
      logger.error(`[SecretsContext] Secret rotation failed`, { key, err, traceId });
      toast.error(`❌ Rotation failed: ${err.message}`);
      throw err;
    }
  };

  // ✅ Revoke a secret
  const revokeSecret = async (key) => {
    try {
      if (!secrets[key]) throw new Error(`Secret "${key}" not found`);
      const updated = { ...secrets };
      delete updated[key];

      await secretsStorage.setItem(STORAGE_KEY, updated, { context: "secrets" });

      const newStatus = { ...status, [key]: SECRET_STATUS.REVOKED };
      setSecrets(updated);
      setStatus(newStatus);
      setLastUpdated(new Date().toISOString());

      toast.success(`✅ Secret "${key}" revoked`);
      logger.info(`[SecretsContext] Secret revoked`, { key, traceId });
    } catch (err) {
      logger.error(`[SecretsContext] Secret revocation failed`, { key, err, traceId });
      toast.error(`❌ Revocation failed: ${err.message}`);
      throw err;
    }
  };

  // ✅ Clear all secrets
  const clearSecrets = async () => {
    try {
      await secretsStorage.removeItem(STORAGE_KEY, { context: "secrets" });
      setSecrets({});
      setStatus({});
      setLastUpdated(new Date().toISOString());
      toast.success("✅ All secrets cleared");
      logger.info("[SecretsContext] Cleared all secrets", { traceId });
    } catch (err) {
      logger.error("[SecretsContext] Clear failed", { err, traceId });
      toast.error("❌ Clear error");
      throw err;
    }
  };

  // ✅ Export secrets
  const exportSecrets = async () => {
    try {
      const exportPayload = {
        secrets,
        status,
        exportedAt: new Date().toISOString(),
        version: "1.0.0",
      };
      const encrypted = await encrypt(JSON.stringify(exportPayload));
      logger.info("[SecretsContext] Secrets exported", {
        count: Object.keys(secrets).length,
        traceId,
      });
      return encrypted;
    } catch (err) {
      logger.error("[SecretsContext] Export failed", { err, traceId });
      toast.error("❌ Export failed");
      throw err;
    }
  };

  // ✅ Import secrets
  const importSecrets = async (encryptedBlob) => {
    try {
      const decrypted = await decrypt(encryptedBlob);
      const parsed = JSON.parse(decrypted);

      if (!parsed.secrets || typeof parsed.secrets !== "object") {
        throw new Error("Malformed import structure");
      }

      Object.entries(parsed.secrets).forEach(([key, secret]) => {
        validateSecret(secret, key);
      });

      await updateSecrets(parsed.secrets);
      toast.success("✅ Secrets imported");
      logger.info("[SecretsContext] Secrets imported", { traceId });
    } catch (err) {
      logger.error("[SecretsContext] Import failed", { err, traceId });
      toast.error(`❌ Import error: ${err.message}`);
      throw err;
    }
  };

  // ✅ Memoized context value
  const value = useMemo(() => ({
    secrets,
    updateSecrets,
    loading,
    error,
    clearSecrets,
    validateSecret,
    getSecret,
    revokeSecret,
    rotateSecret,
    exportSecrets,
    importSecrets,
    lastUpdated,
    status,
    SECRET_TYPES,
    SECRET_STATUS,
  }), [
    secrets,
    loading,
    error,
    lastUpdated,
    status
  ]);

  // 🌀 Loading UI
  if (loading) {
    return (
      <div role="status" className="secrets-loading text-center py-6 text-sm text-gray-600">
        <span className="animate-spin inline-block mr-2">🔐</span>
        Loading encrypted secrets...
      </div>
    );
  }

  // ❌ Error Fallback UI
  if (error && !Object.keys(secrets).length) {
    return (
      <div role="alert" className="secrets-error p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="font-semibold text-red-600">Secret Loading Error</h3>
        <p className="text-sm text-red-500 mb-2">{error.message}</p>
        <button
          className="text-sm bg-red-600 text-white px-3 py-1 rounded"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  // ✅ Return context provider
  return (
    <SecretsContext.Provider value={value}>
      {children}
    </SecretsContext.Provider>
  );
};

// ✅ PropTypes
SecretsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// ✅ Default export
export default SecretsProvider;
