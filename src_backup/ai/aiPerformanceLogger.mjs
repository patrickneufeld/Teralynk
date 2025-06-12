// File: /backend/src/ai/aiPerformanceLogger.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logInfo, logError } from '../../utils/logger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.join(__dirname, '../../../logs');
const LOG_FILE = path.join(LOG_DIR, 'ai_performance.log');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Append a structured AI performance log to file.
 * @param {string} service - Name of the AI service or module.
 * @param {object} stats - Performance metrics (latency, tokens, model, status, etc.)
 */
export function logAIPerformance(service, stats = {}) {
  try {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      service,
      ...stats,
    };
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
    logInfo(`🧠 AI Performance logged: ${service}`, entry);
  } catch (err) {
    logError('❌ Failed to log AI performance.', err);
  }
}

/**
 * Read the last N entries from AI performance logs.
 * @param {number} limit - Number of lines to read
 * @returns {Array<object>} Array of parsed log entries
 */
export function readRecentAIPerformanceLogs(limit = 100) {
  try {
    const lines = fs.readFileSync(LOG_FILE, 'utf-8').trim().split('\n');
    const recent = lines.slice(-limit).map((line) => JSON.parse(line));
    return recent;
  } catch (err) {
    logError('❌ Failed to read AI performance logs.', err);
    return [];
  }
}

export default {
  logAIPerformance,
  readRecentAIPerformanceLogs,
};
