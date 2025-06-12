/**
 * Input sanitization utilities for preventing XSS and other injection attacks
 */

const ALLOWED_TAGS = [
  'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
];

const ALLOWED_ATTRIBUTES = {
  'a': ['href', 'title', 'target'],
  '*': ['class', 'id', 'data-*']
};

/**
 * Sanitizes HTML strings by escaping special characters
 */
export const sanitizeHTML = (str) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitizes plain text input by removing special characters
 */
export const sanitizeText = (str) => {
  if (!str) return '';
  return str.replace(/[^\w\s-]/g, '');
};

/**
 * ✅ Generic sanitizeInput alias for plain text (used in router)
 */
export const sanitizeInput = (input) => sanitizeText(input);

/**
 * Sanitizes email addresses
 */
export const sanitizeEmail = (email) => {
  if (!email) return '';
  return email.toLowerCase().trim().replace(/[^a-z0-9@._-]/g, '');
};

/**
 * Sanitizes URL strings
 */
export const sanitizeURL = (url) => {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    return '';
  }
};

/**
 * Sanitizes file names
 */
export const sanitizeFileName = (fileName) => {
  if (!fileName) return '';
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_');
};

/**
 * Sanitizes JSON input
 */
export const sanitizeJSON = (json) => {
  if (typeof json === 'string') {
    try {
      json = JSON.parse(json);
    } catch {
      return null;
    }
  }

  if (!json || typeof json !== 'object') {
    return null;
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(json)) {
    const sanitizedKey = sanitizeText(key);
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeHTML(value);
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.map(item =>
        typeof item === 'string' ? sanitizeHTML(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[sanitizedKey] = sanitizeJSON(value);
    } else {
      sanitized[sanitizedKey] = value;
    }
  }
  return sanitized;
};

/**
 * Sanitizes SQL input to prevent SQL injection
 */
export const sanitizeSQL = (str) => {
  if (!str) return '';
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
    switch (char) {
      case '\0': return '\\0';
      case '\x08': return '\\b';
      case '\x09': return '\\t';
      case '\x1a': return '\\z';
      case '\n': return '\\n';
      case '\r': return '\\r';
      case '"':
      case '\'':
      case '\\':
      case '%':
        return '\\' + char;
      default:
        return char;
    }
  });
};

/**
 * Validates and sanitizes form input data
 */
export const sanitizeFormData = (formData, schema = {}) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(formData)) {
    const fieldType = schema[key]?.type || 'text';
    switch (fieldType) {
      case 'email':
        sanitized[key] = sanitizeEmail(value);
        break;
      case 'url':
        sanitized[key] = sanitizeURL(value);
        break;
      case 'html':
        sanitized[key] = sanitizeHTML(value);
        break;
      case 'filename':
        sanitized[key] = sanitizeFileName(value);
        break;
      case 'json':
        sanitized[key] = sanitizeJSON(value);
        break;
      case 'sql':
        sanitized[key] = sanitizeSQL(value);
        break;
      default:
        sanitized[key] = sanitizeText(value);
    }
  }
  return sanitized;
};

export default {
  sanitizeInput,
  sanitizeHTML,
  sanitizeText,
  sanitizeEmail,
  sanitizeURL,
  sanitizeFileName,
  sanitizeJSON,
  sanitizeSQL,
  sanitizeFormData,
  ALLOWED_TAGS,
  ALLOWED_ATTRIBUTES
};
