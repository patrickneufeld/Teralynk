// ================================================
// ✅ FILE: /backend/src/utils/jwtHelper.mjs
// JWT Helper Functions for Consistent Secret Access
// ================================================

import jwt from 'jsonwebtoken';
import { logInfo, logError } from './logging/index.mjs';

/**
 * Gets the JWT secret from environment variables
 * @returns {string} The JWT secret
 * @throws {Error} If JWT secret is missing or invalid
 */
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  
  // Enhanced debugging
  console.log('JWT Secret validation:', {
    exists: !!secret,
    length: secret?.length,
    firstChars: secret?.substring(0, 3) + '...',
    isBase64: /^[A-Za-z0-9+/=]+$/.test(secret || ''),
    timestamp: new Date().toISOString()
  });
  
  if (!secret || secret.length < 16) {
    const error = new Error('JWT Secret missing or invalid. Check environment variables.');
    console.error('JWT SECRET ERROR:', error);
    throw error;
  }
  
  return secret;
}

/**
 * Signs a JWT token with consistent secret access
 * @param {Object} payload - The data to include in the token
 * @param {Object} options - JWT sign options
 * @returns {string} The signed JWT token
 */
export function signToken(payload, options = { expiresIn: '24h' }) {
  try {
    const secret = getJwtSecret();
    
    // Validate payload
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid token payload');
    }
    
    // Add timestamp to payload for debugging
    const enhancedPayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000)
    };
    
    const token = jwt.sign(enhancedPayload, secret, options);
    return token;
  } catch (error) {
    console.error('Failed to sign JWT token:', error);
    logError('Failed to sign JWT token', { error: error.message });
    throw error;
  }
}

/**
 * Verifies a JWT token with consistent secret access
 * @param {string} token - The token to verify
 * @returns {Object} The decoded token payload
 */
export function verifyToken(token) {
  try {
    const secret = getJwtSecret();
    return jwt.verify(token, secret);
  } catch (error) {
    logError('Failed to verify JWT token', { error: error.message });
    throw error;
  }
}
