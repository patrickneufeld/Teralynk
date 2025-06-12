// ================================================
// ✅ FILE: /frontend/src/utils/validation.js
// Input Validation and Sanitization Utilities
// Version: 2.0.0
// ================================================

import { logError } from '@/utils/logging';

// ==============================
// 🛡️ Security Constants
// ==============================

const VALIDATION_RULES = Object.freeze({
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    MIN_UPPERCASE: 1,
    MIN_LOWERCASE: 1,
    MIN_NUMBERS: 1,
    MIN_SPECIAL: 1,
    ALLOWED_SPECIAL: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  },
  EMAIL: {
    MAX_LENGTH: 254, // RFC 5321
    MIN_LENGTH: 3,
    ALLOWED_SPECIAL: '!#$%&\'*+-/=?^_`{|}~' // RFC 5322
  },
  URL: {
    MAX_LENGTH: 2083, // IE maximum URL length
    PROTOCOLS: ['http:', 'https:']
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 32,
    ALLOWED_CHARS: /^[a-zA-Z0-9_.-]+$/
  }
});

// ==============================
// 🧹 Sanitization Functions
// ==============================

/**
 * Sanitizes email addresses
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
export const sanitizeEmail = (email) => {
  if (!email) return '';
  return email.toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .slice(0, VALIDATION_RULES.EMAIL.MAX_LENGTH);
};

/**
 * Sanitizes URLs
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL
 */
export const sanitizeURL = (url) => {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    if (!VALIDATION_RULES.URL.PROTOCOLS.includes(urlObj.protocol)) {
      throw new Error('Invalid protocol');
    }
    return urlObj.toString()
      .trim()
      .slice(0, VALIDATION_RULES.URL.MAX_LENGTH);
  } catch {
    return '';
  }
};

/**
 * Sanitizes username
 * @param {string} username - Username to sanitize
 * @returns {string} Sanitized username
 */
export const sanitizeUsername = (username) => {
  if (!username) return '';
  return username.toString()
    .trim()
    .replace(/[^a-zA-Z0-9_.-]/g, '')
    .slice(0, VALIDATION_RULES.USERNAME.MAX_LENGTH);
};

// ==============================
// ✅ Validation Functions
// ==============================

/**
 * Validates email addresses
 * @param {string} email - Email to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateEmail = (email) => {
  try {
    if (!email?.trim()) {
      return 'Email is required.';
    }

    const sanitized = sanitizeEmail(email);
    
    if (sanitized.length < VALIDATION_RULES.EMAIL.MIN_LENGTH) {
      return 'Email is too short.';
    }
    
    if (sanitized.length > VALIDATION_RULES.EMAIL.MAX_LENGTH) {
      return 'Email is too long.';
    }

    // RFC 5322 compliant email regex
    const emailRegex = new RegExp(
      `^[a-zA-Z0-9${VALIDATION_RULES.EMAIL.ALLOWED_SPECIAL}]+` +
      '@' +
      '[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]' +
      '(?:\\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$'
    );

    if (!emailRegex.test(sanitized)) {
      return 'Please enter a valid email address.';
    }

    return null;
  } catch (error) {
    logError('Email validation failed', { error, email });
    return 'Email validation failed.';
  }
};

/**
 * Validates passwords
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {string|null} Error message or null if valid
 */
export const validatePassword = (password, options = {}) => {
  try {
    const rules = { ...VALIDATION_RULES.PASSWORD, ...options };
    const issues = [];

    if (!password) {
      return 'Password is required.';
    }

    if (password.length < rules.MIN_LENGTH) {
      issues.push(`at least ${rules.MIN_LENGTH} characters`);
    }

    if (password.length > rules.MAX_LENGTH) {
      issues.push(`no more than ${rules.MAX_LENGTH} characters`);
    }

    if ((password.match(/[A-Z]/g) || []).length < rules.MIN_UPPERCASE) {
      issues.push('an uppercase letter');
    }

    if ((password.match(/[a-z]/g) || []).length < rules.MIN_LOWERCASE) {
      issues.push('a lowercase letter');
    }

    if ((password.match(/[0-9]/g) || []).length < rules.MIN_NUMBERS) {
      issues.push('a number');
    }

    if ((password.match(new RegExp(`[${rules.ALLOWED_SPECIAL}]`, 'g')) || []).length < rules.MIN_SPECIAL) {
      issues.push(`a special character (${rules.ALLOWED_SPECIAL})`);
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      issues.push('no repeated characters (more than 2 times)');
    }

    if (/^[0-9]*$/.test(password)) {
      issues.push('not only numbers');
    }

    if (/^[a-zA-Z]*$/.test(password)) {
      issues.push('not only letters');
    }

    return issues.length ? `Password must include: ${issues.join(', ')}.` : null;
  } catch (error) {
    logError('Password validation failed', { error });
    return 'Password validation failed.';
  }
};

/**
 * Validates URLs
 * @param {string} url - URL to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateURL = (url) => {
  try {
    if (!url?.trim()) {
      return 'URL is required.';
    }

    const sanitized = sanitizeURL(url);
    if (!sanitized) {
      return 'Please enter a valid URL.';
    }

    const urlObj = new URL(sanitized);
    if (!VALIDATION_RULES.URL.PROTOCOLS.includes(urlObj.protocol)) {
      return 'URL must use HTTP or HTTPS protocol.';
    }

    if (sanitized.length > VALIDATION_RULES.URL.MAX_LENGTH) {
      return 'URL is too long.';
    }

    return null;
  } catch (error) {
    logError('URL validation failed', { error, url });
    return 'Please enter a valid URL.';
  }
};

/**
 * Validates username
 * @param {string} username - Username to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateUsername = (username) => {
  try {
    if (!username?.trim()) {
      return 'Username is required.';
    }

    const sanitized = sanitizeUsername(username);

    if (sanitized.length < VALIDATION_RULES.USERNAME.MIN_LENGTH) {
      return `Username must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters.`;
    }

    if (sanitized.length > VALIDATION_RULES.USERNAME.MAX_LENGTH) {
      return `Username must be no more than ${VALIDATION_RULES.USERNAME.MAX_LENGTH} characters.`;
    }

    if (!VALIDATION_RULES.USERNAME.ALLOWED_CHARS.test(sanitized)) {
      return 'Username can only contain letters, numbers, and the characters: _.-';
    }

    return null;
  } catch (error) {
    logError('Username validation failed', { error, username });
    return 'Username validation failed.';
  }
};

/**
 * Validates password confirmation
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {string|null} Error message or null if valid
 */
export const validateConfirmPassword = (password, confirmPassword) => {
  try {
    if (!confirmPassword?.trim()) {
      return 'Confirmation password is required.';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }

    return null;
  } catch (error) {
    logError('Password confirmation validation failed', { error });
    return 'Password confirmation failed.';
  }
};

/**
 * Validates form fields
 * @param {Object} fields - Fields to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation errors
 */
export const validateForm = (fields, options = {}) => {
  try {
    const errors = {};

    if ('email' in fields) {
      errors.email = validateEmail(fields.email);
    }

    if ('password' in fields) {
      errors.password = validatePassword(fields.password, options.password);
    }

    if ('confirmPassword' in fields) {
      errors.confirmPassword = validateConfirmPassword(
        fields.password,
        fields.confirmPassword
      );
    }

    if ('url' in fields) {
      errors.url = validateURL(fields.url);
    }

    if ('username' in fields) {
      errors.username = validateUsername(fields.username);
    }

    return Object.fromEntries(
      Object.entries(errors).filter(([_, value]) => value !== null)
    );
  } catch (error) {
    logError('Form validation failed', { error, fields: Object.keys(fields) });
    return { _error: 'Form validation failed.' };
  }
};

/**
 * Generic input validation
 * @param {any} value - Value to validate
 * @param {string} type - Type of validation
 * @returns {boolean} Whether the value is valid
 */
export const validateInput = (value, type) => {
  try {
    switch (type) {
      case 'email':
        return !validateEmail(value);
      case 'password':
        return !validatePassword(value);
      case 'url':
        return !validateURL(value);
      case 'username':
        return !validateUsername(value);
      default:
        return false;
    }
  } catch (error) {
    logError('Input validation failed', { error, type });
    return false;
  }
};

// ==============================
// 📤 Exports
// ==============================

export default {
  validateEmail,
  validatePassword,
  validateURL,
  validateUsername,
  validateConfirmPassword,
  validateForm,
  validateInput,
  sanitizeEmail,
  sanitizeURL,
  sanitizeUsername,
  VALIDATION_RULES
};
