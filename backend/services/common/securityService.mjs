// ✅ FILE: /backend/services/securityService.js

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Redis = require('redis');
const { promisify } = require('util');
const { hasPermission } = require('./rbacService');
const { recordActivity } = require('../activityLogService');
const { query } = require('../db');

// ENV vars
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION || '1h';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Validate env
if (!JWT_SECRET) throw new Error('Missing JWT_SECRET in environment variables');

// Redis client
const redisClient = Redis.createClient({ url: REDIS_URL });
redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.connect().catch((err) => {
  console.error('Error connecting to Redis:', err);
  process.exit(1);
});

// Promisify Redis methods for consistency
const redisGet = promisify(redisClient.get).bind(redisClient);
const redisSet = promisify(redisClient.set).bind(redisClient);

// Password hashing
const hashPassword = async (password) => {
  if (!password) throw new Error('Password is required');
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (password, hash) => {
  if (!password || !hash) throw new Error('Password and hash required');
  return bcrypt.compare(password, hash);
};

// JWT
const generateToken = (userId, permissions = []) => {
  if (!userId) throw new Error('User ID is required');
  return jwt.sign({ userId, permissions }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
};

const verifyToken = (token) => {
  if (!token) throw new Error('Token is required');
  return jwt.verify(token, JWT_SECRET);
};

// 🔐 AES-256-GCM encryption utilities
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Recommended for GCM
const KEY_LENGTH = 32;

/**
 * 🔑 Derive encryption key from JWT_SECRET using SHA-256
 */
const getAesKey = () => {
  return crypto.createHash('sha256').update(JWT_SECRET).digest().slice(0, KEY_LENGTH);
};

/**
 * Encrypt data using AES-256-GCM with random IV and auth tag
 */
const encryptData = (data) => {
  if (!data) throw new Error('Data required for encryption');
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getAesKey();

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64')
  ].join(':');
};

/**
 * Decrypt AES-256-GCM encrypted data
 */
const decryptData = (cipherText) => {
  if (!cipherText) throw new Error('Encrypted data is required');
  const [ivB64, tagB64, dataB64] = cipherText.split(':');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Invalid encryption format');

  const key = getAesKey();
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const encrypted = Buffer.from(dataB64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
};

// 📜 Log security events
const logSecurityEvent = async (userId, eventType, details = {}) => {
  if (!userId || !eventType) throw new Error('User ID and event type required');
  try {
    await query(
      'INSERT INTO security_events (user_id, event_type, details, timestamp) VALUES ($1, $2, $3, $4)',
      [userId, eventType, JSON.stringify(details), new Date()]
    );
    await recordActivity(userId, 'securityEvent', null, { eventType, details });
    console.log(`✅ Security event logged: ${eventType} for user: ${userId}`);
  } catch (err) {
    console.error('❌ Error logging security event:', err);
    throw new Error('Security event logging failed');
  }
};

// 🚫 Token Blacklisting
const blacklistToken = async (token) => {
  if (!token) throw new Error('Token required for blacklisting');
  const decoded = jwt.decode(token);
  const expiresIn = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 3600;
  await redisSet(token, 'blacklisted', { EX: expiresIn });
};

const isTokenBlacklisted = async (token) => {
  if (!token) throw new Error('Token required for blacklist check');
  const result = await redisGet(token);
  return result !== null;
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  encryptData,
  decryptData,
  logSecurityEvent,
  blacklistToken,
  isTokenBlacklisted
};
