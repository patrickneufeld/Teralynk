// File: /backend/src/routes/troubleshootingRoutes.mjs

import express from 'express';
import { analyzeProjectFiles, debugFile } from '../ai/aiTroubleshooter.mjs';
import troubleshootingLogger from '../utils/troubleshootingLogger.mjs';
import { requireAuth } from '../middleware/authMiddleware.mjs';
import pkg from 'pg';
const { Client } = pkg;
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Initialize PostgreSQL Client for Logging
const dbClient = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false, require: true },
});

dbClient.connect()
    .then(() => console.log('PostgreSQL Connected Successfully for Troubleshooting Logs'))
    .catch(err => console.error('PostgreSQL Connection Error:', err.message));

/**
 * AI Troubleshooting for Entire Project
 * @route POST /api/troubleshoot/project
 */
router.post('/project', requireAuth, async (req, res) => {
    const { projectPath, description } = req.body;

    if (!projectPath) {
        return res.status(400).json({ error: 'Project path is required.' });
    }

    try {
        const debugResult = await analyzeProjectFiles(projectPath);

        // Store in PostgreSQL
        const logId = uuidv4();
        await dbClient.query(
            `INSERT INTO troubleshooting_logs (id, user_id, query, response, category, created_at) VALUES ($1, $2, $3, $4, 'project', NOW())`,
            [logId, req.user.id, projectPath, JSON.stringify(debugResult)]
        );

        res.status(200).json({ message: 'Project debugging completed successfully.', result: debugResult });
    } catch (err) {
        troubleshootingLogger.logTroubleshootingError('Project debugging error', { error: err.message });
        res.status(500).json({ error: 'AI debugging failed.', details: err.message });
    }
});

/**
 * AI Troubleshooting for Single File
 * @route POST /api/troubleshoot/file
 */
router.post('/file', requireAuth, async (req, res) => {
    const { filePath, codeContent, description } = req.body;

    if (!filePath || !codeContent) {
        return res.status(400).json({ error: 'File path and code content are required.' });
    }

    try {
        const debugResult = await debugFile({ filePath, codeContent, description });

        // Store in PostgreSQL
        const logId = uuidv4();
        await dbClient.query(
            `INSERT INTO troubleshooting_logs (id, user_id, query, response, category, created_at) VALUES ($1, $2, $3, $4, 'file', NOW())`,
            [logId, req.user.id, filePath, JSON.stringify(debugResult)]
        );

        res.status(200).json({ message: 'File debugging completed successfully.', result: debugResult });
    } catch (err) {
        troubleshootingLogger.logTroubleshootingError('File debugging error', { error: err.message });
        res.status(500).json({ error: 'AI file debugging failed.', details: err.message });
    }
});

/**
 * Retrieve Troubleshooting Logs
 * @route GET /api/troubleshoot/logs
 */
router.get('/logs', requireAuth, async (req, res) => {
    try {
        const result = await dbClient.query(
            'SELECT id, query, response, category, created_at FROM troubleshooting_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );
        res.status(200).json({ message: 'Troubleshooting logs retrieved successfully.', logs: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve logs.', details: err.message });
    }
});

/**
 * Retrieve AI Insights from Logs
 * @route GET /api/troubleshoot/ai-insights
 */
router.get('/ai-insights', requireAuth, async (req, res) => {
    try {
        const logs = await dbClient.query(
            'SELECT response FROM troubleshooting_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
            [req.user.id]
        );

        const insights = await troubleshootingLogger.getAIInsights(logs.rows.map(row => row.response).join('\n'));

        res.status(200).json({ message: 'AI insights retrieved successfully.', insights });
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve AI insights.', details: err.message });
    }
});

/**
 * Delete Specific Troubleshooting Log
 * @route DELETE /api/troubleshoot/logs/:id
 */
router.delete('/logs/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await dbClient.query(
            'DELETE FROM troubleshooting_logs WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Log not found.' });
        }

        res.json({ message: 'Troubleshooting log deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete log.', details: err.message });
    }
});

/**
 * Clear All Troubleshooting Logs (Admin Only)
 * @route DELETE /api/troubleshoot/clear
 */
router.delete('/clear', requireAuth, async (req, res) => {
    try {
        await dbClient.query('DELETE FROM troubleshooting_logs WHERE user_id = $1', [req.user.id]);
        res.status(200).json({ message: 'All troubleshooting logs cleared successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to clear logs.', details: err.message });
    }
});

/**
 * Troubleshooting API Health Check
 * @route GET /api/troubleshoot/test
 */
router.get('/test', (req, res) => {
    res.status(200).json({ message: 'Troubleshooting API is working correctly!' });
});

export default router;
