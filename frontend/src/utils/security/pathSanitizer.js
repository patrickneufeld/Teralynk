// /frontend/src/utils/security/pathSanitizer.js

/**
 * Sanitize path input to prevent traversal or unsafe redirects.
 * Ensures the path is clean, safe, and normalized.
 *
 * @param {string} path
 * @returns {string}
 */
export function sanitizePath(path) {
  if (!path || typeof path !== 'string') return '/';

  // Prevent path traversal
  let sanitized = path.replace(/(\.\.\/|\\)/g, '/');

  // Remove duplicate slashes
  sanitized = sanitized.replace(/\/{2,}/g, '/');

  // Strip unsafe characters
  sanitized = sanitized.replace(/[<>{}[\]^`|\\]/g, '');

  // Ensure path starts with '/'
  if (!sanitized.startsWith('/')) sanitized = '/' + sanitized;

  return sanitized;
}
