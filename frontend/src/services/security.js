// File: /frontend/src/services/security.js

import axios from '../api/axiosClient';

/**
 * Frontend SecurityService class for calculating password strength
 * and initializing security context via backend integration.
 */
export class SecurityService {
  /**
   * Calculate password strength score: 0 (weak) to 3 (strong).
   * @param {string} password
   * @returns {number}
   */
  calculatePasswordStrength(password) {
    let score = 0;

    if (!password) return score;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return Math.min(score, 3);
  }

  /**
   * Setup security context by calling backend /api/security-context
   * to fetch public keys, user policies, etc.
   */
  async setupSecurityContext() {
    try {
      const response = await axios.get('/api/security-context');
      if (response.data) {
        // Example: store public key, policy, etc. for session use
        sessionStorage.setItem('SECURITY_CTX', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Failed to setup security context:', error);
    }
  }

  /**
   * Optionally fetch and cache JWKS or public key.
   */
  async fetchJWKS() {
    try {
      const response = await axios.get('/api/jwks.json');
      if (response.data && response.data.keys) {
        return response.data.keys;
      }
    } catch (error) {
      console.error('Failed to fetch JWKS:', error);
    }
    return [];
  }
}
