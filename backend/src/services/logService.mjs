// ✅ FILE: /backend/src/services/logService.js

import fs from 'fs';
import path from 'path';
import { parse } from 'json2csv';
import { fileURLToPath } from 'url';
import db from '../config/db.mjs';
import { logError, logInfo } from '../utils/logger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.join(__dirname, '../logs');

// ✅ Ensure export directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ✅ Fetch all logs for CSV export
export async function getAllLogs() {
  try {
    const { rows } = await db.query(
      `SELECT id, user_id, query, response, category, created_at
       FROM troubleshooting_logs
       ORDER BY created_at DESC`
    );
    logInfo(`📦 Retrieved ${rows.length} logs for CSV export`);
    return rows;
  } catch (error) {
    logError('❌ Failed to fetch all logs', { error: error.message });
    throw new Error('Fetching logs failed');
  }
}

// ✅ Prune logs older than X days
export async function pruneOldLogs(days = 30) {
  try {
    const result = await db.query(
      `DELETE FROM troubleshooting_logs WHERE created_at < NOW() - interval '${days} days'`
    );
    logInfo(`🧹 Pruned ${result.rowCount} logs older than ${days} days`);
    return { success: true, deleted: result.rowCount };
  } catch (error) {
    logError('❌ Failed to prune logs', { error: error.message });
    throw new Error('Log pruning failed');
  }
}

// ✅ Search logs by keyword and/or date range
export async function searchLogs({ keyword = '', startDate, endDate, userId }) {
  try {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (keyword) {
      conditions.push(`(query ILIKE $${idx} OR response ILIKE $${idx})`);
      params.push(`%${keyword}%`);
      idx++;
    }

    if (startDate) {
      conditions.push(`created_at >= $${idx}`);
      params.push(startDate);
      idx++;
    }

    if (endDate) {
      conditions.push(`created_at <= $${idx}`);
      params.push(endDate);
      idx++;
    }

    if (userId) {
      conditions.push(`user_id = $${idx}`);
      params.push(userId);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT * FROM troubleshooting_logs ${where} ORDER BY created_at DESC LIMIT 100`;

    const { rows } = await db.query(query, params);
    logInfo(`🔍 Retrieved ${rows.length} log entries`);
    return rows;
  } catch (error) {
    logError('❌ Failed to search logs', { error: error.message });
    throw new Error('Log search failed');
  }
}

// ✅ Export logs to CSV
export function exportLogsToCSV(logs, outputName = 'logs-export.csv') {
  try {
    if (!logs || logs.length === 0) {
      throw new Error('No logs to export');
    }

    const fields = ['id', 'user_id', 'query', 'response', 'category', 'created_at'];
    const opts = { fields };
    const csv = parse(logs, opts);

    const exportPath = path.join(logsDir, outputName);
    fs.writeFileSync(exportPath, csv, 'utf8');

    logInfo(`📤 Logs exported to CSV: ${exportPath}`);
    return exportPath;
  } catch (error) {
    logError('❌ Failed to export logs to CSV', { error: error.message });
    throw new Error('CSV export failed');
  }
}
