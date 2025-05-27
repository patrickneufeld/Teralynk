// File: /backend/src/ai/core/quantum/QuantumSecureLayer.js

import { QuantumResistantEncryption } from './QuantumResistantEncryption.mjs';
import { CORE_CONFIG } from '../../../ai/config/CoreConfig.mjs';
import { logDebug, logError } from '../../../utils/logger.mjs';


class QuantumSecureLayer {
  constructor() {
    this.qre = new QuantumResistantEncryption(CORE_CONFIG.QUANTUM_SECURITY);
    this.keyPairs = new Map();
    this.sessionKeys = new Map();
    this.lastRotation = Date.now();
  }

  async generateKeyPair(contextId) {
    try {
      const keyPair = await this.qre.generateKeyPair();
      this.keyPairs.set(contextId, {
        keys: keyPair,
        created: Date.now(),
        rotationScheduled: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      });
      logDebug('Generated key pair for context', { contextId });
      return keyPair.publicKey;
    } catch (error) {
      logError('Failed to generate key pair', { contextId, error: error.message });
      throw error;
    }
  }

  async encryptData(data, contextId) {
    try {
      let keyPair = this.keyPairs.get(contextId);

      // Check for key pair existence and rotation schedule
      if (!keyPair || Date.now() > keyPair.rotationScheduled) {
        logDebug('Generating new key pair', { contextId });
        const newKeyPair = await this.generateKeyPair(contextId);
        keyPair = this.keyPairs.get(contextId); // Update keyPair after generation
      }

      const sessionKey = await this.qre.generateSessionKey();
      const encryptedData = await this.qre.encrypt(data, sessionKey);
      const encryptedSessionKey = await this.qre.encryptSessionKey(
        sessionKey,
        keyPair.keys.publicKey // Access publicKey correctly
      );

      logDebug('Data encrypted', { contextId });
      return {
        data: encryptedData,
        sessionKey: encryptedSessionKey,
        timestamp: Date.now(),
        algorithm: CORE_CONFIG.QUANTUM_SECURITY.POST_QUANTUM_SCHEMES[0],
      };
    } catch (error) {
      logError('Failed to encrypt data', { contextId, error: error.message });
      throw error;
    }
  }


  async decryptData(encryptedPackage, contextId) {
    try {
      const keyPair = this.keyPairs.get(contextId);
      if (!keyPair) {
        const errMsg = 'No key pair found for context';
        logError(errMsg, { contextId });
        throw new Error(errMsg); // Throw error for better handling
      }

      const sessionKey = await this.qre.decryptSessionKey(
        encryptedPackage.sessionKey,
        keyPair.keys.privateKey
      );
      const decryptedData = await this.qre.decrypt(encryptedPackage.data, sessionKey);

      logDebug('Data decrypted', { contextId });
      return decryptedData;

    } catch (error) {
      logError('Failed to decrypt data', { contextId, error: error.message });
      throw error;
    }
  }
}

export { QuantumSecureLayer };

