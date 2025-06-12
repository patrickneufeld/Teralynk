import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
/**
 * AI File Security Module
 * Provides enterprise-grade file security checks, risk assessments, and anomaly detection
 * across user-uploaded documents and collaborative resources.
 */

import { query } from '../config/db.mjs';
import { logInfo, logError } from '../utils/logging/index.mjs';

/**
 * Scan a file's metadata and content for security risks
 * @param {string} userId - The ID of the user requesting the scan
 * @param {object} fileMeta - Metadata about the file (filename, type, size, etc.)
 * @param {string} content - Raw or parsed file content
 * @returns {Promise<object>} - Scan result summary
 */
export async function scanFileForThreats(userId, fileMeta, content) {
  try {
    logInfo('🔍 Scanning file for threats...', { userId, fileMeta });

    // Basic rule-based threat detection (expandable with ML later)
    const threats = [];

    if (/password|ssn|credit\s?card/i.test(content)) {
      threats.push('Sensitive data detected');
    }
    if (fileMeta.type === 'application/x-msdownload') {
      threats.push('Executable file type detected');
    }

    const result = {
      userId,
      fileName: fileMeta.name,
      detectedThreats: threats,
      scannedAt: new Date().toISOString(),
    };

    logInfo('✅ File scan complete', result);
    return result;
  } catch (error) {
    logError('❌ File scan failed', { error, fileMeta });
    throw new Error('Security scan failed');
  }
}

/**
 * Audit access history of a file to detect abnormal patterns
 * @param {string} fileId - ID of the file
 * @returns {Promise<object>} - Audit summary and potential anomalies
 */
export async function auditFileAccess(fileId) {
  try {
    const result = await query(
      `SELECT user_id, accessed_at, ip_address
       FROM file_access_logs
       WHERE file_id = $1
       ORDER BY accessed_at DESC`,
      [fileId]
    );

    const anomalies = [];
    const uniqueIPs = new Set();

    for (const entry of result.rows) {
      if (uniqueIPs.has(entry.ip_address)) continue;
      uniqueIPs.add(entry.ip_address);
    }

    if (uniqueIPs.size > 5) {
      anomalies.push('Multiple IP addresses detected in short period');
    }

    const audit = {
      fileId,
      accessCount: result.rows.length,
      uniqueIPs: uniqueIPs.size,
      anomalies,
    };

    logInfo('📊 File audit complete', audit);
    return audit;
  } catch (error) {
    logError('❌ File audit failed', { error, fileId });
    throw new Error('File audit error');
  }
}

/**
 * Record a file access event into file_access_logs table
 * @param {string} fileId 
 * @param {string} userId 
 * @param {string} ipAddress 
 */
export async function logFileAccess(fileId, userId, ipAddress) {
  try {
    await query(
      `INSERT INTO file_access_logs (file_id, user_id, ip_address)
       VALUES ($1, $2, $3)`,
      [fileId, userId, ipAddress]
    );
    logInfo('📝 File access logged', { fileId, userId, ipAddress });
  } catch (error) {
    logError('❌ Failed to log file access', { error });
  }
}

export default {
  scanFileForThreats,
  auditFileAccess,
  logFileAccess,
};
