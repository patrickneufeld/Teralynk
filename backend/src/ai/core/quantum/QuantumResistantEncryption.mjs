// File: /backend/src/ai/core/quantum/QuantumResistantEncryption.js

import crypto from 'crypto';
import { logDebug, logError } from '../../../utils/logger.mjs';

class QuantumResistantEncryption {
  constructor(config) {
    this.config = config;
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16;
  }

  async generateKeyPair() {
    try {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: this.config.KEY_SIZE,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });

      logDebug('Generated RSA key pair');
      return { publicKey, privateKey };
    } catch (error) {
      logError('Failed to generate key pair', { error: error.message });
      throw error;
    }
  }

  async generateSessionKey() {
    try {
      const sessionKey = crypto.randomBytes(this.keyLength);
      logDebug('Generated session key');
      return sessionKey;
    } catch (error) {
      logError('Failed to generate session key', { error: error.message });
      throw error;
    }
  }

  async encrypt(data, sessionKey) {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, sessionKey, iv);
      let encrypted = cipher.update(data, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      const authTag = cipher.getAuthTag();

      logDebug('Data encrypted');
      return {
        iv: iv.toString('hex'),
        encrypted: encrypted.toString('hex'),
        authTag: authTag.toString('hex'),
      };
    } catch (error) {
      logError('Failed to encrypt data', { error: error.message });
      throw error;
    }
  }

  async decrypt(encryptedPackage, sessionKey) {
    try {
      const { iv, encrypted, authTag } = encryptedPackage;
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        sessionKey,
        Buffer.from(iv, 'hex')
      );
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      let decrypted = decipher.update(Buffer.from(encrypted, 'hex'));
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      logDebug('Data decrypted');
      return decrypted.toString('utf8');
    } catch (error) {
      logError('Failed to decrypt data', { error: error.message });
      throw error;
    }
  }

  async encryptSessionKey(sessionKey, publicKey) {
    try {
      const encryptedSessionKey = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        sessionKey
      );

      logDebug('Session key encrypted');
      return encryptedSessionKey.toString('hex');
    } catch (error) {
      logError('Failed to encrypt session key', { error: error.message });
      throw error;
    }
  }

  async decryptSessionKey(encryptedSessionKey, privateKey) {
    try {
      const sessionKey = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        Buffer.from(encryptedSessionKey, 'hex')
      );

      logDebug('Session key decrypted');
      return sessionKey;
    } catch (error) {
      logError('Failed to decrypt session key', { error: error.message });
      throw error;
    }
  }
}

export { QuantumResistantEncryption };
