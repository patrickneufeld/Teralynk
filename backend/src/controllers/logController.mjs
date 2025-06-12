// ✅ FILE: /backend/src/controllers/logController.js

import { parseISO, isValid } from 'date-fns';
import * as logService from '../services/logService.mjs';
import { writeToPath } from '@fast-csv/format';
import { createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ GET /api/admin/logs/export - Export logs to CSV
export const exportLogsToCSV = async (req, res) => {
  try {
    const logs = await logService.searchLogs({}); // Export all logs

    if (!logs || logs.length === 0) {
      return res.status(404).json({ message: 'No logs available to export.' });
    }

    const fileId = uuidv4();
    const fileName = `logs_export_${fileId}.csv`;
    const outputPath = path.join(__dirname, '../../exports/', fileName);

    await new Promise((resolve, reject) => {
      writeToPath(outputPath, logs, { headers: true })
        .on('finish', resolve)
        .on('error', reject);
    });

    logger.info(`Logs exported to CSV: ${fileName}`);
    return res.download(outputPath, fileName);
  } catch (error) {
    logger.error('Failed to export logs to CSV', { error });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ✅ DELETE /api/admin/logs/prune/:days - Prune logs older than X days
export const pruneOldLogs = async (req, res) => {
  const { days } = req.params;

  const numDays = parseInt(days, 10);
  if (isNaN(numDays) || numDays < 1) {
    return res.status(400).json({ message: 'Invalid number of days' });
  }

  try {
    const { deleted } = await logService.pruneOldLogs(numDays);
    logger.info(`Pruned ${deleted} old logs older than ${numDays} days`);
    return res.status(200).json({
      message: `Pruned ${deleted} logs older than ${numDays} days`,
    });
  } catch (error) {
    logger.error('Error pruning logs', { error });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ✅ POST /api/admin/logs/search - Search logs by keyword and/or date range
export const searchLogs = async (req, res) => {
  const { keyword, startDate, endDate } = req.body;

  if (!keyword && !startDate && !endDate) {
    return res
      .status(400)
      .json({ message: 'At least one search parameter is required.' });
  }

  let parsedStart, parsedEnd;

  if (startDate) {
    parsedStart = parseISO(startDate);
    if (!isValid(parsedStart)) {
      return res.status(400).json({ message: 'Invalid startDate format.' });
    }
  }

  if (endDate) {
    parsedEnd = parseISO(endDate);
    if (!isValid(parsedEnd)) {
      return res.status(400).json({ message: 'Invalid endDate format.' });
    }
  }

  try {
    const results = await logService.searchLogs({ keyword, startDate, endDate });
    if (results.length === 0) {
      return res.status(404).json({ message: 'No matching logs found.' });
    }

    logger.info(`Search completed. ${results.length} results found.`);
    return res.status(200).json(results);
  } catch (error) {
    logger.error('Log search failed', { error });
    return res.status(500).json({ message: 'Internal server error' });
  }
};
