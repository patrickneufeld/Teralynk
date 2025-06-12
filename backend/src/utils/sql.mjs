/**
 * ✅ Sanitize SQL query text for logging
 * @param {string} query - SQL query text
 * @returns {string} - Sanitized SQL query
 */
export const sanitizeSQL = (query) => query.replace(/(\$[0-9]+)/g, "?");
