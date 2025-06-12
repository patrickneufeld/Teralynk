// ✅ FILE: /frontend/src/services/secretsService.js

import apiClient from '@/api/apiClient';
import { encryptData, decryptData } from '@/utils/encryption'; // ✅ Updated to Web Crypto
import logger from '@/utils/logging/logging';
import { SECRET_TYPES } from "@/contexts";

/**
 * Secrets Service
 * 
 * Provides centralized secure API access for managing secrets.
 */

const ENDPOINTS = {
  FETCH: '/api/secrets/fetch',
  SAVE: '/api/secrets/save',
  REVOKE: '/api/secrets/revoke',
  ROTATE: '/api/secrets/rotate',
  EXPORT: '/api/secrets/export',
  IMPORT: '/api/secrets/import',
};

/**
 * Fetch all secrets from backend
 */
export const fetchSecrets = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.FETCH);
    return { success: true, data: response.data };
  } catch (error) {
    logger.error('❌ fetchSecrets failed', 'secretsService', { error });
    return { success: false, error: error.response?.data || error.message };
  }
};

/**
 * Save or update a secret
 */
export const saveSecret = async (key, value, type = SECRET_TYPES.OTHER, expiresInDays = 90) => {
  try {
    const expires = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    const payload = {
      key,
      type,
      value,
      created: new Date().toISOString(),
      expires,
    };

    const encryptedPayload = await encryptData(payload); // ✅ Uses Web Crypto

    const response = await apiClient.post(ENDPOINTS.SAVE, { encrypted: encryptedPayload });

    return { success: true, data: response.data };
  } catch (error) {
    logger.error('❌ saveSecret failed', 'secretsService', { error });
    return { success: false, error: error.response?.data || error.message };
  }
};

/**
 * Revoke a secret
 */
export const revokeSecret = async (key) => {
  try {
    const response = await apiClient.post(ENDPOINTS.REVOKE, { key });
    return { success: true, data: response.data };
  } catch (error) {
    logger.error('❌ revokeSecret failed', 'secretsService', { error });
    return { success: false, error: error.response?.data || error.message };
  }
};

/**
 * Rotate a secret's value
 */
export const rotateSecret = async (key, newValue) => {
  try {
    const response = await apiClient.post(ENDPOINTS.ROTATE, { key, newValue });
    return { success: true, data: response.data };
  } catch (error) {
    logger.error('❌ rotateSecret failed', 'secretsService', { error });
    return { success: false, error: error.response?.data || error.message };
  }
};

/**
 * Export all secrets as encrypted blob
 */
export const exportSecrets = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.EXPORT);
    return { success: true, data: response.data.encryptedBlob };
  } catch (error) {
    logger.error('❌ exportSecrets failed', 'secretsService', { error });
    return { success: false, error: error.response?.data || error.message };
  }
};

/**
 * Import encrypted secrets blob
 */
export const importSecrets = async (encryptedBlob) => {
  try {
    const decrypted = await decryptData(encryptedBlob); // ✅ Uses Web Crypto

    const parsed = JSON.parse(decrypted);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid secrets data structure after decryption.');
    }

    const response = await apiClient.post(ENDPOINTS.IMPORT, { secrets: parsed });

    return { success: true, data: response.data };
  } catch (error) {
    logger.error('❌ importSecrets failed', 'secretsService', { error });
    return { success: false, error: error.response?.data || error.message };
  }
};
