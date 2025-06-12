// ✅ FILE: /backend/services/encryptionService.js

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const { recordActivity } = require('./activityLogService');

dotenv.config();

const secretsManager = new AWS.SecretsManager({
  region: process.env.AWS_REGION || 'us-east-1',
});

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // AES-GCM recommends 12-byte IVs
const TAG_LENGTH = 16; // 128-bit tag length

/**
 * Retrieve encryption key from AWS Secrets Manager
 */
const getEncryptionKey = async () => {
  try {
    const secretName = process.env.ENCRYPTION_SECRET_NAME || 'encryption_key';
    const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
    const secret = data.SecretString ? JSON.parse(data.SecretString) : data.SecretBinary.toString('ascii');
    return Buffer.from(secret.encryption_key, 'hex');
  } catch (err) {
    console.error('❌ Failed to retrieve encryption key:', err);
    throw new Error('Unable to fetch encryption key.');
  }
};

/**
 * Encrypt text with AES-256-GCM
 */
const encryptText = async (plaintext) => {
  try {
    if (!plaintext) throw new Error('Plaintext is required.');
    const key = await getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
      encryptedText: Buffer.concat([iv, tag, encrypted]).toString('hex'),
    };
  } catch (err) {
    console.error('❌ Encryption error:', err);
    throw new Error('Text encryption failed.');
  }
};

/**
 * Decrypt text with AES-256-GCM
 */
const decryptText = async (encryptedHex) => {
  try {
    if (!encryptedHex) throw new Error('Encrypted data is required.');
    const key = await getEncryptionKey();
    const buffer = Buffer.from(encryptedHex, 'hex');

    const iv = buffer.slice(0, IV_LENGTH);
    const tag = buffer.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = buffer.slice(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('❌ Decryption error:', err);
    throw new Error('Text decryption failed.');
  }
};

/**
 * Encrypt a file using AES-256-GCM
 */
const encryptFile = async (inputPath, outputPath) => {
  try {
    const key = await getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const input = await fs.readFile(inputPath);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

    const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
    const tag = cipher.getAuthTag();

    const result = Buffer.concat([iv, tag, encrypted]);
    await fs.writeFile(outputPath, result);
    await recordActivity('system', 'encrypt', inputPath, { outputPath });

    return { outputPath, iv: iv.toString('hex') };
  } catch (err) {
    console.error('❌ File encryption failed:', err);
    throw new Error('File encryption failed.');
  }
};

/**
 * Decrypt a file using AES-256-GCM
 */
const decryptFile = async (inputPath, outputPath) => {
  try {
    const key = await getEncryptionKey();
    const data = await fs.readFile(inputPath);

    const iv = data.slice(0, IV_LENGTH);
    const tag = data.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = data.slice(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    await fs.writeFile(outputPath, decrypted);
    await recordActivity('system', 'decrypt', inputPath, { outputPath });

    return { outputPath };
  } catch (err) {
    console.error('❌ File decryption failed:', err);
    throw new Error('File decryption failed.');
  }
};

/**
 * Generate a new secure 256-bit AES key
 */
const generateSecureKey = () => {
  const key = crypto.randomBytes(32).toString('hex'); // 256-bit key
  console.log('🔑 Generated AES-256-GCM key:', key);
  return key;
};

module.exports = {
  encryptText,
  decryptText,
  encryptFile,
  decryptFile,
  generateSecureKey,
};
