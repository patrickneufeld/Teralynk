// ✅ FILE: /frontend/src/utils/encryption.js

import { getSessionKey } from './tokenManager';

const ENCRYPTION_VERSION = 'v2';
const ENCODING = 'utf-8';
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ITERATIONS = 100000;
const HASH = 'SHA-256';

// 🔁 Base64 encoding/decoding helpers
export function base64ToBytes(base64) {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

export function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

// 🔐 Random IV and salt generators
export function generateRandomIV(length = IV_LENGTH) {
  return crypto.getRandomValues(new Uint8Array(length));
}

export function generateRandomSalt(length = SALT_LENGTH) {
  return crypto.getRandomValues(new Uint8Array(length));
}

// 🔐 Derive AES-GCM CryptoKey from passphrase + salt
export async function deriveKey(passphrase, salt = generateRandomSalt()) {
  if (!passphrase || typeof passphrase !== 'string') {
    throw new Error('Invalid passphrase provided for key derivation');
  }

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: HASH
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return { key, salt };
}

// ✅ High-level encrypt using session or provided passphrase
export async function encryptData(data, passphrase = getSessionKey()) {
  if (!passphrase) throw new Error('Encryption key is missing');
  if (!data) throw new Error('No data provided for encryption');

  const iv = generateRandomIV();
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const { key, salt } = await deriveKey(passphrase);

  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  return `${ENCRYPTION_VERSION}:${bytesToBase64(salt)}:${bytesToBase64(iv)}:${bytesToBase64(ciphertext)}`;
}

// ✅ High-level decrypt using session or provided passphrase
export async function decryptData(encrypted, passphrase = getSessionKey()) {
  if (!passphrase) throw new Error('Decryption key is missing');
  if (!encrypted || typeof encrypted !== 'string') {
    throw new Error('Invalid encrypted payload');
  }

  const parts = encrypted.split(':');
  if (parts.length !== 4) {
    throw new Error('Malformed encryption format');
  }

  const [version, saltB64, ivB64, dataB64] = parts;
  if (version !== ENCRYPTION_VERSION) throw new Error(`Unsupported encryption version: ${version}`);

  const salt = base64ToBytes(saltB64);
  const iv = base64ToBytes(ivB64);
  const ciphertext = base64ToBytes(dataB64);

  const { key } = await deriveKey(passphrase, salt);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);

  return JSON.parse(new TextDecoder().decode(decrypted));
}

// ✅ Low-level encrypt using CryptoKey
export async function encrypt(plaintext, cryptoKey, iv) {
  if (!plaintext || !cryptoKey || !iv) {
    throw new Error('Missing parameters for encryption');
  }

  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, encoded);
  return bytesToBase64(ciphertext);
}

// ✅ Low-level decrypt using CryptoKey
export async function decrypt(ciphertextBase64, cryptoKey, iv) {
  if (!ciphertextBase64 || !cryptoKey || !iv) {
    throw new Error('Missing parameters for decryption');
  }

  const ciphertext = base64ToBytes(ciphertextBase64);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, ciphertext);
  return new TextDecoder().decode(decrypted);
}

// ✅ SHA-256 hashing (e.g. for integrity checking or fingerprinting)
export async function hashSHA256(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input for SHA-256 hashing');
  }

  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest(HASH, encoded);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}
