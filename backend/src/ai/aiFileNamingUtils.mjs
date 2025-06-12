import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// ✅ FILE: /backend/src/ai/aiFileNamingUtils.js

import crypto from 'crypto';
import { logError } from '../utils/logger.mjs';

/**
 * Converts a date object into a file-safe timestamp string.
 * Format: YYYY-MM-DD_HH-MM-SS
 */
export function formatTimestamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

/**
 * Safely substitutes tokens inside a template string.
 * Example: "Report_{topic}_{date}" → "Report_Q1_2024-05-01"
 *
 * @param {string} template
 * @param {Object} context
 * @returns {string}
 */
export function applyTemplate(template, context = {}) {
  return template.replace(/{(\w+)}/g, (_, token) =>
    context[token] !== undefined ? sanitizeSegment(context[token]) : `missing_${token}`
  );
}

/**
 * Sanitizes a string for use in filenames.
 * Removes or replaces characters that could cause issues in most OSes.
 */
export function sanitizeSegment(str) {
  return String(str)
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .substring(0, 100); // prevent overly long segments
}

/**
 * Generates a short hash of the filename and user for disambiguation.
 */
export function generateDisambiguationToken(userId, originalName) {
  const timestamp = Date.now();
  const input = `${userId}:${originalName}:${timestamp}`;
  return generateShortHash(input);
}

/**
 * Extracts file extension from filename.
 * Returns an empty string if none found.
 */
export function extractFileExtension(filename) {
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.slice(lastDot + 1).toLowerCase() : '';
}

/**
 * Normalizes any filename (or user string) into lowercase, underscored slug.
 */
export function normalizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_\-.]/g, '')
    .replace(/\.+/g, '.')
    .slice(0, 100); // DB/FS safe
}

/**
 * Generates a SHA-256 based fingerprint for any content buffer or string.
 * Trims to 10 chars for indexing efficiency.
 */
export function generateContentHash(content) {
  try {
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
    return crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 10);
  } catch (err) {
    logError('generateContentHash failed', { error: err.message });
    return 'nohash';
  }
}

/**
 * Internal utility to produce short SHA-256 hashes.
 * @param {string|Buffer} input
 * @returns {string}
 */
function generateShortHash(input) {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 8);
}
